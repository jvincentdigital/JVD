// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { LookupAddress } from 'node:dns';
import { createSafeLookup, isPublicAddress, parseTarget } from '../lib/a11y-check/url-guard';

describe('isPublicAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // cloud metadata
    '100.100.100.100', // carrier-grade NAT / Tailscale
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fe80::1',
    'fd00:ec2::254', // AWS metadata over IPv6
    'fc00::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe', // mapped 169.254.169.254
    '64:ff9b::10.0.0.1',
    '2002:c0a8:0101::1', // 6to4 wrapping 192.168.1.1
    '::7f00:1', // old IPv4-compatible form of 127.0.0.1
    '64:ff9b:1::1', // local NAT64
    '2001::1', // Teredo
    'fec0::1', // old site-local
    '3fff::1', // documentation
    '5f00::1', // outside 2000::/3
    '2001:10::1', // ORCHID
    'not-an-ip',
  ])('refuses %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(['93.184.215.14', '8.8.8.8', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'])(
    'allows %s',
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );
});

describe('parseTarget', () => {
  it('adds https:// when the visitor leaves it out', () => {
    const url = parseTarget('  example.com/menu  ');
    expect(url).toBeInstanceOf(URL);
    expect((url as URL).href).toBe('https://example.com/menu');
  });

  it('keeps http and https and drops the #fragment', () => {
    expect((parseTarget('http://example.com/#top') as URL).href).toBe('http://example.com/');
  });

  it.each([
    'file:///etc/passwd',
    'ftp://example.com',
    'gopher://example.com',
    'javascript:alert(1)',
    'data:text/html,hi',
    'http://localhost:3000',
    'http://localhost',
    'http://printer.local',
    'http://db.internal',
    'http://127.0.0.1',
    'http://2130706433', // 127.0.0.1 written as one number
    'http://0x7f.1',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data/',
    'http://user:pass@example.com',
    'http://example.com:8080',
    'https://example.com:22',
  ])('blocks %s', (raw) => {
    expect(parseTarget(raw)).toBe('blocked');
  });

  it.each(['', '   ', 'not a url', 'intranet', 'x'.repeat(3000) + '.com'])(
    'calls %j invalid',
    (raw) => {
      expect(parseTarget(raw)).toBe('invalid_url');
    },
  );

  it('allows a public IP and default ports', () => {
    expect(parseTarget('http://8.8.8.8')).toBeInstanceOf(URL);
    expect(parseTarget('https://example.com:443/')).toBeInstanceOf(URL);
  });

  it.each(['mysite.com:443', 'www.site.com:443/x', 'mysite.com:80'])(
    'reads the number after %s as a port, not a scheme',
    (raw) => {
      expect(parseTarget(raw)).toBeInstanceOf(URL);
    },
  );
});

describe('createSafeLookup', () => {
  type Cb = (err: NodeJS.ErrnoException | null, address: unknown, family?: number) => void;
  const fakeResolver = (addresses: LookupAddress[]) =>
    ((_host: string, _opts: unknown, cb: Cb) => cb(null, addresses)) as never;

  const run = (addresses: LookupAddress[], options: object) =>
    new Promise<{ err: NodeJS.ErrnoException | null; address: unknown }>((resolve) => {
      const lookup = createSafeLookup(fakeResolver(addresses)) as unknown as (
        h: string,
        o: object,
        cb: Cb,
      ) => void;
      lookup('site.example', options, (err, address) => resolve({ err, address }));
    });

  it('passes a public answer through', async () => {
    const { err, address } = await run([{ address: '93.184.215.14', family: 4 }], {});
    expect(err).toBeNull();
    expect(address).toBe('93.184.215.14');
  });

  it('returns the full list when asked for all', async () => {
    const list = [{ address: '93.184.215.14', family: 4 }];
    const { address } = await run(list, { all: true });
    expect(address).toEqual(list);
  });

  it('refuses a name that resolves to a private address (DNS rebinding)', async () => {
    const { err } = await run([{ address: '127.0.0.1', family: 4 }], {});
    expect(err?.code).toBe('EBLOCKED');
  });

  it('refuses the whole host if any one answer is private', async () => {
    const { err } = await run(
      [
        { address: '93.184.215.14', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ],
      { all: true },
    );
    expect(err?.code).toBe('EBLOCKED');
  });
});
