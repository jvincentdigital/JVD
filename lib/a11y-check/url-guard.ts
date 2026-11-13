import { BlockList, isIP } from 'node:net';
import { lookup as dnsLookup, type LookupAddress } from 'node:dns';

// The free checker fetches a URL a stranger types, from our server. Everything
// here exists so that URL can only ever reach the public internet: no private
// networks, no loopback, no cloud metadata, no odd ports.

export type GuardError = 'invalid_url' | 'blocked';

const MAX_URL_LENGTH = 2048;

// Address ranges a public website never lives on.
const blocked = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT (also Tailscale)
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, includes cloud metadata 169.254.169.254
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // old 6to4 relay
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, includes broadcast
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
  ['::', 128], // unspecified
  ['::1', 128], // loopback
  ['100::', 64], // discard
  ['2001::', 23], // protocol assignments, includes Teredo 2001::/32
  ['2001:db8::', 32], // documentation
  ['3fff::', 20], // documentation
  ['fc00::', 7], // unique local, includes AWS metadata fd00:ec2::254
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
] as const) {
  blocked.addSubnet(net, prefix, 'ipv6');
}
// All public IPv6 lives in 2000::/3. Anything outside it is refused.
const globalUnicast = new BlockList();
globalUnicast.addSubnet('2000::', 3, 'ipv6');

/** IPv4 hidden inside an IPv6 address (mapped, NAT64, 6to4), if any. */
function embeddedIPv4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  const sixToFour = lower.match(/^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4}):/);
  const parts = hex ?? sixToFour;
  if (!parts) return null;
  const hi = parseInt(parts[1], 16);
  const lo = parseInt(parts[2], 16);
  return [hi >> 8, hi & 255, lo >> 8, lo & 255].join('.');
}

/** True only for an address a public website could live on. */
export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !blocked.check(ip, 'ipv4');
  if (family === 6) {
    const inner = embeddedIPv4(ip);
    // ::ffff:0:0/96 is always a mapped IPv4; anything we cannot read is refused.
    if (ip.toLowerCase().startsWith('::ffff:')) return inner ? isPublicAddress(inner) : false;
    if (!globalUnicast.check(ip, 'ipv6') || blocked.check(ip, 'ipv6')) return false;
    return inner ? isPublicAddress(inner) : true;
  }
  return false;
}

const blockedHostSuffixes = ['.localhost', '.local', '.internal', '.lan', '.home.arpa'];

/**
 * Turn what the visitor typed into a URL we are willing to fetch, or say why not.
 * "mysite.com" is accepted and becomes https://mysite.com/.
 */
export function parseTarget(raw: string): URL | GuardError {
  const typed = raw.trim();
  if (!typed || typed.length > MAX_URL_LENGTH) return 'invalid_url';
  // A colon followed by a digit is a port (mysite.com:443), not a scheme.
  const withScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(typed) ? typed : `https://${typed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return 'invalid_url';
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'blocked';
  if (url.username || url.password) return 'blocked';
  if (url.port && url.port !== '80' && url.port !== '443') return 'blocked';

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host) return 'invalid_url';
  const bare = host.replace(/^\[|\]$/g, '');
  if (isIP(bare)) return isPublicAddress(bare) ? url : 'blocked';
  if (host === 'localhost' || blockedHostSuffixes.some((s) => host.endsWith(s))) return 'blocked';
  // A public site needs a dotted name; single labels resolve on local networks only.
  if (!host.includes('.')) return 'invalid_url';

  url.hash = '';
  return url;
}

type LookupFn = typeof dnsLookup;

/**
 * Drop-in for dns.lookup, passed to http(s).request. The address it hands back
 * is the one the socket connects to, so the check cannot be dodged by a DNS
 * answer that changes between "check" and "connect". If any address for the
 * host is private, the whole host is refused.
 */
export function createSafeLookup(resolve: LookupFn = dnsLookup): LookupFn {
  const safeLookup = (hostname: string, options: unknown, callback?: unknown) => {
    const cb = (typeof options === 'function' ? options : callback) as (
      err: NodeJS.ErrnoException | null,
      address: string | LookupAddress[],
      family?: number,
    ) => void;
    const opts = (typeof options === 'object' && options !== null ? options : {}) as {
      all?: boolean;
      family?: number;
    };

    resolve(hostname, { all: true, family: opts.family ?? 0 }, (err, addresses) => {
      if (err) return cb(err, '', 0);
      const list = addresses as LookupAddress[];
      if (!list.length || !list.every((a) => isPublicAddress(a.address))) {
        const refused: NodeJS.ErrnoException = new Error('blocked_address');
        refused.code = 'EBLOCKED';
        return cb(refused, '', 0);
      }
      if (opts.all) return cb(null, list);
      cb(null, list[0].address, list[0].family);
    });
  };
  return safeLookup as unknown as LookupFn;
}
