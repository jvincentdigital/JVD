import { NextResponse } from 'next/server';
import { parseTarget } from '@/lib/a11y-check/url-guard';
import { fetchErrorCode, fetchPage } from '@/lib/a11y-check/fetch-page';
import { runAxe, TooComplex } from '@/lib/a11y-check/run-axe';
import { summarize } from '@/lib/a11y-check/summary';
import { clientIp, createRateLimiter } from '@/lib/a11y-check/rate-limit';

// Free quick accessibility check. Takes a URL, returns counts and rule ids only.
// The page is fetched into memory, checked and dropped: nothing is stored, and
// logs carry only an error code (never the URL, never an email).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
// One cap for everyone on this server copy, and one check at a time, so many
// visitors together cannot burn the free Vercel allowance either.
const allowAll = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 });
let checking = false;

type ErrorCode =
  | 'invalid_url'
  | 'blocked'
  | 'unreachable'
  | 'timeout'
  | 'too_large'
  | 'not_html'
  | 'rate_limited'
  | 'busy'
  | 'too_complex'
  | 'scan_failed';

function fail(error: ErrorCode, status: number) {
  if (status >= 500) console.warn(`[a11y-check] ${error}`);
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) return fail('rate_limited', 429);

  const raw = await request.text();
  if (raw.length > 4096) return fail('invalid_url', 400);
  let typed: unknown;
  try {
    typed = (JSON.parse(raw) as { url?: unknown }).url;
  } catch {
    return fail('invalid_url', 400);
  }
  if (typeof typed !== 'string') return fail('invalid_url', 400);

  const target = parseTarget(typed);
  if (typeof target === 'string') return fail(target, 400);

  if (checking || !allowAll('all')) return fail('busy', 429);
  checking = true;
  try {
    return await check(target);
  } finally {
    checking = false;
  }
}

async function check(target: URL) {
  let page: Awaited<ReturnType<typeof fetchPage>>;
  try {
    page = await fetchPage(target);
  } catch (err) {
    const code = fetchErrorCode(err) ?? 'unreachable';
    return fail(code, code === 'blocked' ? 400 : 422);
  }

  try {
    const { violations, thin } = await runAxe(page.body, page.contentType, page.finalUrl);
    return NextResponse.json(
      { ok: true, page: pageLabel(page.finalUrl), thin, summary: summarize(violations) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    if (err instanceof TooComplex) return fail('too_complex', 422);
    return fail('scan_failed', 500);
  }
}

/** Host plus path, so a deep link does not read as the whole site. */
function pageLabel(url: URL): string {
  const label = (url.hostname + url.pathname).replace(/\/$/, '');
  return label.length > 60 ? `${label.slice(0, 59)}…` : label;
}
