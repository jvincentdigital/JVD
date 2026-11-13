import { JSDOM, VirtualConsole } from 'jsdom';
import axe from 'axe-core';
import type { RawViolation } from './summary';

// Rules that need a real browser (colors, layout, scrolling). In jsdom they
// would guess, so we turn them off and the page says these were not checked.
export const NEEDS_A_BROWSER = [
  'color-contrast',
  'link-in-text-block',
  'scrollable-region-focusable',
  'target-size',
];

/**
 * Run axe-core on the page HTML as the server sent it. The page's own scripts
 * never run ("outside-only" lets only our axe script run) and jsdom loads no
 * images, styles, frames or other files from the page.
 */
export async function runAxe(
  html: string,
  url: URL,
): Promise<{ violations: RawViolation[]; thin: boolean }> {
  const dom = new JSDOM(html, {
    url: url.href,
    runScripts: 'outside-only',
    virtualConsole: new VirtualConsole(),
  });
  try {
    const { window } = dom;
    window.eval(axe.source);
    const runner = (window as unknown as { axe: typeof axe }).axe;
    const results = await runner.run(window.document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: Object.fromEntries(NEEDS_A_BROWSER.map((id) => [id, { enabled: false }])),
      resultTypes: ['violations'],
    });

    // Pages built in the browser by JavaScript arrive almost empty.
    const doc = window.document;
    const hasScripts = doc.querySelector('script:not([type="application/ld+json"])') !== null;
    doc.querySelectorAll('script, style, noscript, template').forEach((el) => el.remove());
    const text = (doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const thin = hasScripts && text.length < 200;

    return {
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? null,
        nodes: v.nodes.length,
      })),
      thin,
    };
  } finally {
    dom.window.close();
  }
}
