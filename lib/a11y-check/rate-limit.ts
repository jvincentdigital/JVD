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

/** Visitor IP as Vercel reports it. Vercel sets x-forwarded-for itself. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'unknown';
}
