import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type { Readable } from 'node:stream';
import { createSafeLookup, parseTarget } from './url-guard';

export type FetchError = 'blocked' | 'unreachable' | 'timeout' | 'too_large' | 'not_html';

export const FETCH_LIMITS = {
  timeoutMs: 8000, // whole fetch, all redirects included
  maxBytes: 2 * 1024 * 1024, // after decompression
  maxRedirects: 3,
};

const USER_AGENT = 'JVD-QuickCheck/1.0 (+https://jvdigital.dev/en/free-accessibility-check)';
const safeLookup = createSafeLookup();

class Stop extends Error {
  constructor(public code: FetchError) {
    super(code);
  }
}

type Hop = { kind: 'redirect'; location: string } | { kind: 'page'; html: string };

function requestOnce(url: URL, signal: AbortSignal): Promise<Hop> {
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'es-PR,es;q=0.9,en;q=0.8',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ kind: 'redirect', location: res.headers.location });
        }
        if (status < 200 || status >= 300) {
          res.resume();
          return reject(new Stop('unreachable'));
        }
        const type = String(res.headers['content-type'] ?? '').toLowerCase();
        if (!type.includes('html')) {
          res.resume();
          return reject(new Stop('not_html'));
        }
        const declared = Number(res.headers['content-length'] ?? 0);
        if (declared > FETCH_LIMITS.maxBytes) {
          res.destroy();
          return reject(new Stop('too_large'));
        }

        // Count bytes after decompression, so a tiny gzip bomb cannot blow up memory.
        const encoding = String(res.headers['content-encoding'] ?? '').toLowerCase();
        let body: Readable = res;
        if (encoding === 'gzip' || encoding === 'x-gzip') body = res.pipe(zlib.createGunzip());
        else if (encoding === 'deflate') body = res.pipe(zlib.createInflate());
        else if (encoding === 'br') body = res.pipe(zlib.createBrotliDecompress());

        const chunks: Buffer[] = [];
        let size = 0;
        body.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > FETCH_LIMITS.maxBytes) {
            res.destroy();
            body.destroy();
            reject(new Stop('too_large'));
            return;
          }
          chunks.push(chunk);
        });
        body.on('end', () =>
          resolve({ kind: 'page', html: Buffer.concat(chunks).toString('utf8') }),
        );
        const fail = () => reject(new Stop(signal.aborted ? 'timeout' : 'unreachable'));
        res.on('error', fail);
        res.on('aborted', fail);
        if (body !== res) body.on('error', fail);
      },
    );
    req.on('error', (err: NodeJS.ErrnoException) => {
      if (err instanceof Stop) return reject(err);
      if (err.code === 'EBLOCKED') return reject(new Stop('blocked'));
      if (signal.aborted) return reject(new Stop('timeout'));
      reject(new Stop('unreachable'));
    });
    req.end();
  });
}

/**
 * Fetch one public HTML page. Every redirect hop goes back through the URL
 * guard and the safe DNS lookup. Nothing is cached or written anywhere.
 */
export async function fetchPage(start: URL): Promise<{ html: string; finalUrl: URL }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_LIMITS.timeoutMs);
  try {
    let url = start;
    for (let hop = 0; hop <= FETCH_LIMITS.maxRedirects; hop++) {
      const result = await requestOnce(url, controller.signal);
      if (result.kind === 'page') return { html: result.html, finalUrl: url };
      let next: URL;
      try {
        next = new URL(result.location, url);
      } catch {
        throw new Stop('unreachable');
      }
      const checked = parseTarget(next.href);
      if (typeof checked === 'string') throw new Stop('blocked');
      url = checked;
    }
    throw new Stop('unreachable');
  } catch (err) {
    if (err instanceof Stop) throw err;
    throw new Stop(controller.signal.aborted ? 'timeout' : 'unreachable');
  } finally {
    clearTimeout(timer);
  }
}

export function fetchErrorCode(err: unknown): FetchError | null {
  return err instanceof Stop ? err.code : null;
}
