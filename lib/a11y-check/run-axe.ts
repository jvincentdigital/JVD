import path from 'node:path';
import { Worker } from 'node:worker_threads';
import type { RawViolation } from './summary';

// Rules that need a real browser (colors, layout, scrolling). In jsdom they
// would guess, so we turn them off and the page says these were not checked.
export const NEEDS_A_BROWSER = [
  'color-contrast',
  'link-in-text-block',
  'scrollable-region-focusable',
  'target-size',
];

// Some small pages (many images inside links) make axe in jsdom take close to
// a minute. These caps keep one check cheap, whatever page it gets.
export const AXE_LIMITS = {
  maxTags: 3000, // counted before jsdom starts
  timeoutMs: 10_000,
  maxMemoryMb: 512,
};

/** The page is too heavy for the quick check. */
export class TooComplex extends Error {
  constructor() {
    super('too_complex');
  }
}

// Read from disk at run time (not bundled). next.config.mjs traces it for Vercel.
const WORKER_FILE = path.join(process.cwd(), 'lib/a11y-check/axe-worker.cjs');

// Never true. Next's file tracer only ships the packages this route requires,
// and only the worker uses these two, so name them here for the Vercel bundle.
if (process.env.A11Y_TRACE_ONLY === 'never') {
  require('jsdom');
  require('axe-core');
}

/** True when the page has more opening tags than the quick check will take. */
export function tooManyTags(body: Buffer, max = AXE_LIMITS.maxTags): boolean {
  const tags = /<[a-z]/gi;
  const text = body.toString('latin1');
  let count = 0;
  while (tags.exec(text)) if (++count > max) return true;
  return false;
}

/** Keep the charset the server sent, but always parse as HTML. */
function htmlContentType(contentType: string): string {
  const charset = /charset=["']?([\w.:-]+)/i.exec(contentType)?.[1];
  return charset ? `text/html; charset=${charset}` : 'text/html';
}

/**
 * Run axe-core on the page as the server sent it, in a worker thread with a
 * memory cap and a time limit. The page's own scripts never run
 * ("outside-only" lets only our axe script run) and jsdom loads no images,
 * styles, frames or other files from the page.
 */
export function runAxe(
  body: Buffer,
  contentType: string,
  url: URL,
): Promise<{ violations: RawViolation[]; thin: boolean }> {
  if (tooManyTags(body)) return Promise.reject(new TooComplex());

  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_FILE, {
      workerData: {
        body,
        contentType: htmlContentType(contentType),
        url: url.href,
        rulesOff: NEEDS_A_BROWSER,
      },
      resourceLimits: { maxOldGenerationSizeMb: AXE_LIMITS.maxMemoryMb },
    });
    const stop = (err?: Error) => {
      clearTimeout(timer);
      void worker.terminate();
      if (err) reject(err);
    };
    const timer = setTimeout(() => stop(new TooComplex()), AXE_LIMITS.timeoutMs);

    worker.once('message', (msg: { ok: boolean; violations: RawViolation[]; thin: boolean }) => {
      stop();
      if (msg.ok) resolve({ violations: msg.violations, thin: msg.thin });
      else reject(new Error('scan_failed'));
    });
    worker.once('error', (err: NodeJS.ErrnoException) =>
      stop(err.code === 'ERR_WORKER_OUT_OF_MEMORY' ? new TooComplex() : err),
    );
    // Exiting without an answer (a no-op if we already settled).
    worker.once('exit', () => stop(new Error('scan_failed')));
  });
}
