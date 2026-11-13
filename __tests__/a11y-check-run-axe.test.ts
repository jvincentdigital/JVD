// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { AXE_LIMITS, runAxe, TooComplex, tooManyTags } from '../lib/a11y-check/run-axe';

const url = new URL('https://site.example/');
// An image inside a link plus a word: 3 tags per block, and very slow for axe in jsdom.
const blocks = (n: number) =>
  Buffer.from(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${'<div><a href="/x"><img src="a.png"></a> word</div>'.repeat(n)}</body></html>`,
  );

async function errorOf(body: Buffer) {
  try {
    await runAxe(body, 'text/html', url);
    return 'ok';
  } catch (err) {
    return err instanceof TooComplex ? 'too_complex' : 'other';
  }
}

describe('runAxe', () => {
  it('finds problems on a normal page', async () => {
    const { violations } = await runAxe(blocks(3), 'text/html; charset=utf-8', url);
    expect(violations.map((v) => v.id)).toContain('image-alt');
  });

  it('counts opening tags only', () => {
    expect(tooManyTags(Buffer.from('<p>a</p><p>b</p>'), 2)).toBe(false);
    expect(tooManyTags(Buffer.from('<p>a</p><p>b</p><p>c</p>'), 2)).toBe(true);
  });

  it('refuses the 1,000-block page at once', async () => {
    const start = Date.now();
    expect(await errorOf(blocks(1000))).toBe('too_complex');
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('stops a slow page just under the tag cap in under 11 seconds', async () => {
    const body = blocks(Math.floor((AXE_LIMITS.maxTags - 4) / 3));
    expect(tooManyTags(body)).toBe(false);
    const start = Date.now();
    expect(await errorOf(body)).toBe('too_complex');
    expect(Date.now() - start).toBeLessThan(11_000);
  }, 15_000);
});
