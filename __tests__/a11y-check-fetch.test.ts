// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
// vi.mock calls below are hoisted above this import, so it gets the fake network.
import { fetchPage, fetchErrorCode, FETCH_LIMITS } from '../lib/a11y-check/fetch-page';

// Fake the network: each test queues the responses the "server" gives back.
type Fake = { status: number; headers: Record<string, string>; body?: Buffer | string };
const queue: Fake[] = [];
const requested: string[] = [];

function fakeRequest(url: URL, _opts: unknown, onResponse: (res: unknown) => void) {
  const req = new EventEmitter() as EventEmitter & { end: () => void };
  req.end = () => {
    requested.push(url.href);
    const next = queue.shift();
    if (!next)
      return req.emit('error', Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }));
    const res = Object.assign(Readable.from(next.body ? [Buffer.from(next.body)] : []), {
      statusCode: next.status,
      headers: next.headers,
    });
    onResponse(res);
  };
  return req;
}

vi.mock('node:http', () => ({ default: { request: fakeRequest } }));
vi.mock('node:https', () => ({ default: { request: fakeRequest } }));

async function codeOf(url: string) {
  try {
    await fetchPage(new URL(url));
    return 'ok';
  } catch (err) {
    return fetchErrorCode(err);
  }
}

beforeEach(() => {
  queue.length = 0;
  requested.length = 0;
});

describe('fetchPage', () => {
  it('returns the HTML of a normal page', async () => {
    queue.push({ status: 200, headers: { 'content-type': 'text/html' }, body: '<h1>Hi</h1>' });
    const page = await fetchPage(new URL('https://site.example/'));
    expect(page.body.toString()).toBe('<h1>Hi</h1>');
    expect(page.contentType).toBe('text/html');
  });

  it('follows a redirect to another public page', async () => {
    queue.push({ status: 301, headers: { location: 'https://www.site.example/home' } });
    queue.push({ status: 200, headers: { 'content-type': 'text/html' }, body: 'ok' });
    const page = await fetchPage(new URL('https://site.example/'));
    expect(page.finalUrl.href).toBe('https://www.site.example/home');
  });

  it.each([
    'http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost:8080/',
    'file:///etc/passwd',
    'http://[::1]/',
  ])('refuses a redirect to %s without requesting it', async (location) => {
    queue.push({ status: 302, headers: { location } });
    expect(await codeOf('https://site.example/')).toBe('blocked');
    expect(requested).toEqual(['https://site.example/']);
  });

  it('stops after too many redirects', async () => {
    for (let i = 0; i <= FETCH_LIMITS.maxRedirects; i++) {
      queue.push({ status: 302, headers: { location: `https://site.example/${i}` } });
    }
    expect(await codeOf('https://site.example/')).toBe('unreachable');
  });

  it('refuses pages that are not HTML', async () => {
    queue.push({ status: 200, headers: { 'content-type': 'image/png' }, body: 'x' });
    expect(await codeOf('https://site.example/logo.png')).toBe('not_html');
  });

  it('refuses a page that says it is too big', async () => {
    queue.push({
      status: 200,
      headers: { 'content-type': 'text/html', 'content-length': String(FETCH_LIMITS.maxBytes + 1) },
    });
    expect(await codeOf('https://site.example/')).toBe('too_large');
  });

  it('stops reading a page that turns out too big', async () => {
    queue.push({
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: 'a'.repeat(FETCH_LIMITS.maxBytes + 10),
    });
    expect(await codeOf('https://site.example/')).toBe('too_large');
  });

  it('refuses an encoding it cannot read', async () => {
    queue.push({
      status: 200,
      headers: { 'content-type': 'text/html', 'content-encoding': 'gzip, gzip' },
      body: 'junk',
    });
    expect(await codeOf('https://site.example/')).toBe('unreachable');
  });

  it('treats error pages as unreachable', async () => {
    queue.push({ status: 404, headers: { 'content-type': 'text/html' }, body: 'nope' });
    expect(await codeOf('https://site.example/')).toBe('unreachable');
  });
});
