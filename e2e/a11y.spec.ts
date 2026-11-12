import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { path: '/en', name: 'home (en)' },
  { path: '/es', name: 'home (es)' },
  { path: '/en/work/imperfect-gaming', name: 'case study (en)' },
  { path: '/en/pr-accessibility-study', name: 'accessibility study (en)' },
  { path: '/es/pr-accessibility-study', name: 'accessibility study (es)' },
  { path: '/en/totally-fake', name: '404 (en)' },
  { path: '/es/work/does-not-exist', name: '404 case study (es)' },
];

// ScrollReveal hides below-the-fold sections until they scroll into view, so a
// scan of the page as loaded only sees the first screen. Walk to the bottom a
// screen at a time, let every reveal finish, then scan the whole page.
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize()?.height ?? 720;
  for (let y = 0; y < height; y += step / 2) {
    await page.mouse.wheel(0, step / 2);
    await page.waitForTimeout(150);
  }
  // Reveals last 0.8s plus stagger; wait them out so nothing is mid-fade.
  await page.waitForTimeout(1500);
}

for (const { path, name } of pages) {
  test(`a11y: ${name} has no WCAG AA violations (after scrolling)`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await scrollThrough(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
