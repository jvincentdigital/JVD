// In-memory limit per visitor IP. Free, no database. Each server instance keeps
// its own count and forgets it on restart, so it slows abuse but is not exact.

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function allow(key: string, now = Date.now()): boolean {
    if (hits.size > 5000) {
      hits.forEach((times, k) => {
        if (times[times.length - 1] <= now - windowMs) hits.delete(k);
      });
    }
    const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}

/**
 * Visitor key from the IP Vercel reports (Vercel sets x-forwarded-for itself).
 * IPv6 visitors are keyed by their /64, since one home or phone line usually
 * gets a whole /64 and could otherwise pick a new address for every check.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headers.get('x-real-ip') || 'unknown';
  if (!ip.includes(':') || ip.includes('.')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('%')[0].split('::');
  const left = head ? head.split(':') : [];
  const right = ip.includes('::') && tail ? tail.split(':') : [];
  const groups = [
    ...left,
    ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'),
    ...right,
  ];
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ''))
    .join(':')}::/64`;
}
