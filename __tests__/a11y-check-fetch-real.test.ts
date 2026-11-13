// @vitest-environment node
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { fetchPage, fetchErrorCode, FETCH_LIMITS } from '../lib/a11y-check/fetch-page';

// A real local server, so the stream events behave like Node's real ones.
// An IP literal skips DNS, so the safe lookup is not involved here.
let server: http.Server;
let base = '';

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' }); // chunked, no Content-Length
    if (req.url === '/big') {
      const chunk = Buffer.alloc(64 * 1024, 'a');
      let sent = 0;
      const pump = () => {
        while (sent <= FETCH_LIMITS.maxBytes + chunk.length) {
          sent += chunk.length;
          if (!res.write(chunk)) return res.once('drain', pump);
        }
        res.end();
      };
      return pump();
    }
    res.end('<h1>Hi</h1>');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
});

describe('fetchPage with a real socket', () => {
  it('reads a normal page', async () => {
    const page = await fetchPage(new URL(`${base}/`));
    expect(page.body.toString()).toBe('<h1>Hi</h1>');
  });

  it('says too_large for a page over the cap with no Content-Length', async () => {
    let code: string | null = 'ok';
    try {
      await fetchPage(new URL(`${base}/big`));
    } catch (err) {
      code = fetchErrorCode(err);
    }
    expect(code).toBe('too_large');
  });
});
