// diagram: turn a small JSON spec into one self-contained HTML file with an
// inline SVG flow diagram in JVD colours. Opens offline; no fonts or scripts
// are fetched.
//
// House rules (ideas from diagram-design, MIT, github.com/cathrynlavery/diagram-design;
// our own code): every coordinate sits on a 4px grid, one accent colour on at
// most two "focus" nodes, 1px lines, no shadows, radius <= 10, every colour
// pair passes WCAG contrast, and a diagram that needs more than 12 boxes
// should be split (or written as a paragraph).
//
// Spec: { title, subtitle?, nodes: [{ id, label, sub?, focus? }], edges: [{ from, to, label? }] }
// Layout is top-down in layers; an edge may only go to the very next layer.
//
// Usage: node scripts/design/diagram.mjs   (renders docs/diagrams/*.json to .html)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, contrast, MIN_TEXT, MIN_MARK } from './tokens.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIAGRAM_DIR = join(ROOT, 'docs', 'diagrams');

const MAX_NODES = 12;
const MAX_FOCUS = 2;
const MARGIN = 48;
const GAP_X = 32;
const GAP_Y = 64;
const RADIUS = 8;

const FONT = {
  title: "Fraunces, Georgia, 'Times New Roman', serif",
  label: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
};

// Every colour pair the diagram paints, with the minimum it must meet.
export const COLOUR_PAIRS = [
  { use: 'title', fg: 'charcoal', bg: 'cream', min: MIN_TEXT },
  { use: 'subtitle', fg: 'warm-gray', bg: 'cream', min: MIN_TEXT },
  { use: 'node label', fg: 'charcoal', bg: 'white', min: MIN_TEXT },
  { use: 'node sublabel', fg: 'warm-gray', bg: 'white', min: MIN_TEXT },
  { use: 'focus label', fg: 'accent-dark', bg: 'white', min: MIN_TEXT },
  { use: 'node border', fg: 'warm-gray', bg: 'cream', min: MIN_MARK },
  { use: 'focus border', fg: 'accent-dark', bg: 'cream', min: MIN_MARK },
  { use: 'edge + label', fg: 'warm-gray', bg: 'cream', min: MIN_TEXT },
];

export function checkColours() {
  return COLOUR_PAIRS.map((p) => {
    const ratio = contrast(palette[p.fg], palette[p.bg]);
    return { ...p, ratio, ok: ratio >= p.min };
  });
}

const snap = (n, step) => Math.ceil(n / step) * step;

export function validate(spec) {
  const errors = [];
  if (!spec.title) errors.push('title is required');
  const nodes = spec.nodes ?? [];
  const ids = new Set();
  for (const n of nodes) {
    if (!n.id || !n.label) errors.push(`node needs id and label: ${JSON.stringify(n)}`);
    if (ids.has(n.id)) errors.push(`duplicate node id "${n.id}"`);
    ids.add(n.id);
  }
  if (nodes.length === 0) errors.push('no nodes');
  if (nodes.length > MAX_NODES) {
    errors.push(`${nodes.length} nodes (max ${MAX_NODES}); split it or write a paragraph`);
  }
  const focus = nodes.filter((n) => n.focus).length;
  if (focus > MAX_FOCUS) errors.push(`${focus} focus nodes (max ${MAX_FOCUS}); one accent only`);
  for (const e of spec.edges ?? []) {
    if (!ids.has(e.from) || !ids.has(e.to)) errors.push(`edge ${e.from} -> ${e.to}: unknown id`);
  }
  return errors;
}

// Longest-path layering (Kahn). Throws on cycles.
function layers(nodes, edges) {
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) indeg.set(e.to, indeg.get(e.to) + 1);
  const queue = nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  let seen = 0;
  while (queue.length) {
    const id = queue.shift();
    seen++;
    for (const e of edges.filter((x) => x.from === id)) {
      depth.set(e.to, Math.max(depth.get(e.to), depth.get(id) + 1));
      indeg.set(e.to, indeg.get(e.to) - 1);
      if (indeg.get(e.to) === 0) queue.push(e.to);
    }
  }
  if (seen < nodes.length) throw new Error('diagram has a cycle; flows must run one way');
  return depth;
}

/** Positions for every node and edge, all on the 4px grid. */
export function layout(spec) {
  const errors = validate(spec);
  if (errors.length) throw new Error(errors.join('\n'));
  const edges = spec.edges ?? [];
  const depth = layers(spec.nodes, edges);
  for (const e of edges) {
    if (depth.get(e.to) - depth.get(e.from) !== 1) {
      throw new Error(`edge ${e.from} -> ${e.to} skips a layer; add a step or split the diagram`);
    }
  }

  const h = spec.nodes.some((n) => n.sub) ? 56 : 40;
  // Widths in steps of 8 so every centre lands on the 4px grid.
  const sized = spec.nodes.map((n) => ({
    ...n,
    w: Math.max(128, snap(Math.max(n.label.length * 8, (n.sub ?? '').length * 7.2) + 32, 8)),
    h,
    layer: depth.get(n.id),
  }));
  const rows = [];
  for (const n of sized) (rows[n.layer] ??= []).push(n);
  const rowWidth = (row) => row.reduce((s, n) => s + n.w, 0) + GAP_X * (row.length - 1);
  const titleWidth = Math.max(spec.title.length * 13, (spec.subtitle ?? '').length * 7.6);
  const width = snap(Math.max(titleWidth, ...rows.map(rowWidth)) + MARGIN * 2, 8);
  const top = spec.subtitle ? 112 : 88;

  rows.forEach((row, i) => {
    let x = snap((width - rowWidth(row)) / 2, 4);
    for (const n of row) {
      n.x = x;
      n.y = top + i * (h + GAP_Y);
      x += n.w + GAP_X;
    }
  });
  const byId = new Map(sized.map((n) => [n.id, n]));
  const routed = edges.map((e) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    const sx = a.x + a.w / 2;
    const sy = a.y + a.h;
    return { ...e, sx, sy, mid: sy + GAP_Y / 2, tx: b.x + b.w / 2, ty: b.y };
  });
  const height = top + rows.length * h + (rows.length - 1) * GAP_Y + MARGIN;
  return { width, height, nodes: sized, edges: routed };
}

/** Every number in the layout that must sit on the 4px grid. */
export function offGrid(l) {
  const nums = [l.width, l.height];
  for (const n of l.nodes) nums.push(n.x, n.y, n.w, n.h);
  for (const e of l.edges) nums.push(e.sx, e.sy, e.mid, e.tx, e.ty);
  return nums.filter((v) => v % 4 !== 0);
}

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ENTITIES[c]);

export function render(spec) {
  const bad = checkColours().filter((c) => !c.ok);
  if (bad.length) throw new Error(`contrast fails: ${bad.map((c) => c.use).join(', ')}`);
  const l = layout(spec);
  const off = offGrid(l);
  if (off.length) throw new Error(`off the 4px grid: ${off.join(', ')}`);

  const c = palette;
  const desc = l.edges
    .map((e) => {
      const from = l.nodes.find((n) => n.id === e.from).label;
      const to = l.nodes.find((n) => n.id === e.to).label;
      return `${from} to ${to}${e.label ? ` (${e.label})` : ''}`;
    })
    .join('; ');

  const svg = [];
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.width} ${l.height}" width="${l.width}" height="${l.height}" role="img" aria-labelledby="t d">`,
    `<title id="t">${esc(spec.title)}</title>`,
    `<desc id="d">${esc(desc)}</desc>`,
    `<defs><marker id="arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${c['warm-gray']}"/></marker></defs>`,
    `<rect width="${l.width}" height="${l.height}" fill="${c.cream}"/>`,
    `<text x="${MARGIN}" y="56" font-family="${FONT.title}" font-size="28" fill="${c.charcoal}">${esc(spec.title)}</text>`,
  );
  if (spec.subtitle) {
    svg.push(
      `<text x="${MARGIN}" y="84" font-family="${FONT.label}" font-size="14" fill="${c['warm-gray']}">${esc(spec.subtitle)}</text>`,
    );
  }
  for (const e of l.edges) {
    const bend = e.sx === e.tx ? '' : ` V${e.mid} H${e.tx}`;
    const d = `M${e.sx} ${e.sy}${bend} V${e.ty}`;
    svg.push(
      `<path d="${d}" fill="none" stroke="${c['warm-gray']}" stroke-width="1" marker-end="url(#arrow)"/>`,
    );
    if (e.label) {
      svg.push(
        `<text x="${e.tx + 8}" y="${e.ty - 12}" font-family="${FONT.mono}" font-size="11" fill="${c['warm-gray']}">${esc(e.label)}</text>`,
      );
    }
  }
  for (const n of l.nodes) {
    const stroke = n.focus ? c['accent-dark'] : c['warm-gray'];
    const ink = n.focus ? c['accent-dark'] : c.charcoal;
    const cx = n.x + n.w / 2;
    // Label sits above the sublabel, or alone in the vertical middle.
    const ly = n.sub ? n.y + 24 : n.y + n.h / 2 + 4;
    svg.push(
      `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${RADIUS}" fill="${c.white}" stroke="${stroke}" stroke-width="1"/>`,
      `<text x="${cx}" y="${ly}" text-anchor="middle" font-family="${FONT.label}" font-size="14" font-weight="600" fill="${ink}">${esc(n.label)}</text>`,
    );
    if (n.sub) {
      svg.push(
        `<text x="${cx}" y="${n.y + 44}" text-anchor="middle" font-family="${FONT.mono}" font-size="12" fill="${c['warm-gray']}">${esc(n.sub)}</text>`,
      );
    }
  }
  svg.push('</svg>');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(spec.title)}</title>`,
    `<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:${c.cream}}svg{max-width:100%;height:auto}</style>`,
    '</head>',
    '<body>',
    ...svg,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function main() {
  const specs = readdirSync(DIAGRAM_DIR).filter((f) => f.endsWith('.json'));
  for (const f of specs) {
    const spec = JSON.parse(readFileSync(join(DIAGRAM_DIR, f), 'utf8'));
    const out = join(DIAGRAM_DIR, f.replace(/\.json$/, '.html'));
    writeFileSync(out, render(spec));
    console.log(`wrote docs/diagrams/${f.replace(/\.json$/, '.html')}`);
  }
  for (const c of checkColours()) {
    console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.use}: ${c.fg} on ${c.bg} ${c.ratio.toFixed(2)}:1`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
