// Self-test for the design tools. Built-in node:test only, so it runs without
// installing anything: node scripts/design/selftest.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { palette, contrast, blend } from './tokens.mjs';
import { lintSource, eyebrowFindings } from './lint.mjs';
import { validate, layout, offGrid, render, checkColours } from './diagram.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const rules = (src) => lintSource('x.tsx', src).findings.map((f) => `${f.tier}:${f.rule}`);
const LOW_TEXT = ['floor:low-contrast-text'];

test('contrast maths matches WCAG reference values', () => {
  assert.equal(contrast('#000000', '#FFFFFF').toFixed(2), '21.00');
  assert.equal(contrast(palette.accent, palette.cream).toFixed(2), '2.72');
  assert.ok(contrast(palette['accent-dark'], palette.cream) >= 4.5);
  assert.equal(blend('#000000', '#FFFFFF', 0.5), '#808080');
});

test('lint: accent text on cream is a floor failure, accent-dark passes', () => {
  assert.deepEqual(rules(`<p className='text-sm text-accent'>Hi</p>`), LOW_TEXT);
  assert.deepEqual(rules(`<a className='hover:text-accent'>Hi</a>`), LOW_TEXT);
  assert.deepEqual(rules(`<p className='text-sm text-accent-dark'>Hi</p>`), []);
  assert.deepEqual(rules(`<p className='text-charcoal/40'>Hi</p>`), LOW_TEXT);
});

test('lint: large text uses the 3:1 minimum', () => {
  assert.deepEqual(rules(`<p className='text-6xl text-accent'>404</p>`), LOW_TEXT);
  assert.deepEqual(rules(`<p className='text-6xl text-warm-gray'>404</p>`), []);
});

test('lint: white text is only checked against a background on the same element', () => {
  assert.deepEqual(rules(`<p className='text-white'>Hi</p>`), []);
  assert.deepEqual(rules(`<a className='bg-accent text-white'>Go</a>`), LOW_TEXT);
  assert.deepEqual(rules(`<a className='bg-accent-dark text-white'>Go</a>`), []);
});

test('lint: low-contrast icons are reflex, or finish when aria-hidden', () => {
  const hidden = `<svg aria-hidden='true' className='text-accent'></svg>`;
  assert.deepEqual(rules(`<svg className='h-4 text-accent'></svg>`), ['reflex:low-contrast-icon']);
  assert.deepEqual(rules(hidden), ['finish:low-contrast-icon']);
});

test('lint: removing the outline needs a focus ring, except appear-on-focus skip links', () => {
  assert.deepEqual(rules(`<a className='focus:outline-none'>x</a>`), ['floor:focus-removed']);
  assert.deepEqual(rules(`<a className='focus:outline-none focus:ring-2'>x</a>`), []);
  assert.deepEqual(rules(`<a className='sr-only focus:not-sr-only focus:outline-none'>x</a>`), []);
});

test('lint: emoji as icons fail, copyright sign does not', () => {
  assert.deepEqual(rules(`<span>🚀 Launch</span>`), ['floor:emoji-icon']);
  assert.deepEqual(rules(`<span>© 2026</span>`), []);
});

test('lint: raw hex is reflex and can be kept with a written reason', () => {
  const src = `<path stroke='#00A86B' />`;
  assert.deepEqual(rules(src), ['reflex:raw-hex']);
  assert.deepEqual(rules(`// design-lint allow raw-hex: brand mark colour\n${src}`), []);
  assert.deepEqual(rules(`// design-lint allow raw-hex:\n${src}`), ['reflex:raw-hex']);
});

test('lint: floor rules cannot be allowed away', () => {
  const src = `// design-lint allow low-contrast-text: looks nice\n<p className='text-accent'>x</p>`;
  assert.deepEqual(rules(src), ['floor:low-contrast-text']);
});

test('lint: eyebrow labels are fine up to the limit', () => {
  const site = { file: 'x.tsx', line: 1 };
  assert.equal(eyebrowFindings([site, site, site]).length, 0);
  assert.equal(eyebrowFindings([site, site, site, site]).length, 4);
  const { eyebrows } = lintSource('x.tsx', `<p className='uppercase tracking-widest'>x</p>`);
  assert.equal(eyebrows.length, 1);
});

const node = (id, extra = {}) => ({ id, label: id, ...extra });

test('diagram: validation enforces the house rules', () => {
  const f = { focus: true };
  const three = [node('a', f), node('b', f), node('c', f)];
  assert.match(validate({ title: 't', nodes: three }).join(), /3 focus nodes/);
  const dangling = { title: 't', nodes: [node('a')], edges: [{ from: 'a', to: 'z' }] };
  assert.match(validate(dangling).join(), /unknown id/);
  const many = Array.from({ length: 13 }, (_, i) => node(`n${i}`));
  assert.match(validate({ title: 't', nodes: many }).join(), /max 12/);
});

test('diagram: cycles and layer-skipping edges are refused', () => {
  const nodes = [node('a'), node('b'), node('c')];
  const cycle = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'a' },
  ];
  assert.throws(() => layout({ title: 't', nodes, edges: cycle }), /cycle/);
  const skip = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'a', to: 'c' },
  ];
  assert.throws(() => layout({ title: 't', nodes, edges: skip }), /skips a layer/);
});

test('diagram: every colour pair passes contrast', () => {
  for (const c of checkColours()) assert.ok(c.ok, `${c.use} is ${c.ratio.toFixed(2)}:1`);
});

const spec = JSON.parse(readFileSync(`${ROOT}docs/diagrams/request-flow.json`, 'utf8'));

test('diagram: example layout is on the 4px grid', () => {
  assert.deepEqual(offGrid(layout(spec)), []);
});

test('diagram: output is accessible, flat, and uses the accent at most twice', () => {
  const html = render(spec);
  assert.match(html, /role="img" aria-labelledby="t d"/);
  assert.match(html, /<desc id="d">Browser request to Vercel Edge Network;/);
  assert.doesNotMatch(html, /filter|shadow|<script|https?:\/\/(?!www\.w3\.org)/);
  assert.ok(html.match(/stroke="#007A4D"/g).length <= 2);
  assert.match(render({ title: 'a<b', nodes: [node('x')] }), /a&lt;b/);
});

test('diagram: committed HTML matches its JSON (run the renderer after edits)', () => {
  const committed = readFileSync(`${ROOT}docs/diagrams/request-flow.html`, 'utf8');
  assert.equal(committed, render(spec));
});
