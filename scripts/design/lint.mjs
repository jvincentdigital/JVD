// design-lint: a small, dependency-free static check for JVD components.
//
// Three tiers (idea from Hallmark, MIT, github.com/nutlope/hallmark):
//   floor  - never ship: contrast, focus, emoji-as-icon. Exit code 1.
//   reflex - default habits that make a page look generated. Fix it, or keep it
//            with a reason: `// design-lint allow <rule>: <why>` in the file.
//   finish - craft notes. Never block.
// Checklist items (emoji icons, visible focus, contrast) echo UI UX Pro Max
// (MIT, github.com/nextlevelbuilder/ui-ux-pro-max-skill). Our own code.
//
// Usage: node scripts/design/lint.mjs   (scans components/ and app/)

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { palette, blend, contrast, MIN_TEXT, MIN_MARK } from './tokens.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCAN_DIRS = ['components', 'app'];
const EYEBROW_LIMIT = 3;
const ICON_TAGS = new Set(['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon']);
// Light-on-dark tokens; only checked when the element sets its own background.
const SKIP_FG = new Set(['white', 'cream']);
const NOT_EMOJI = new Set(['©', '®', '™']);

const CLASS_RE = /className=(?:'([^']*)'|"([^"]*)"|\{`([^`]*)`\})/g;
const TEXT_TOKEN_RE = /^((?:[\w-]+:)*)text-([a-z-]+)(?:\/(\d+))?$/;
const BG_TOKEN_RE = /^((?:[\w-]+:)*)bg-([a-z-]+)$/;
// WCAG "large text" (24px, or ~18.7px bold) only needs 3:1.
const LARGE_RE = /^(?:[\w-]+:)*text-[2-9]xl$/;
const BOLD_XL_RE = /^(?:[\w-]+:)*text-xl$/;
const HEX_ATTR_RE = /\b(?:stroke|fill|className)=\{?['"`][^'"`]*#[0-9a-fA-F]{3,8}\b/g;
// The reason must be on the same line; an empty reason does not count.
const ALLOW_RE = /design-lint allow ([\w-]+):[ \t]*(\S.*)$/gm;

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

// Name and opening-tag text of the JSX element a className belongs to.
function elementAt(src, index) {
  const start = src.lastIndexOf('<', index);
  const tag = /^<([A-Za-z][\w.]*)/.exec(src.slice(start))?.[1] ?? '';
  const close = src.slice(index).search(/[^=]>/);
  const open = src.slice(start, close === -1 ? undefined : index + close + 2);
  return { tag, open };
}

function allowed(src) {
  const rules = new Set();
  for (const m of src.matchAll(ALLOW_RE)) rules.add(m[1]);
  return rules;
}

/** Per-file checks. Returns findings plus eyebrow sites for the cross-file rule. */
export function lintSource(file, src) {
  const findings = [];
  const eyebrows = [];
  const allow = allowed(src);
  const add = (rule, tier, index, message) => {
    if (tier !== 'floor' && allow.has(rule)) return;
    findings.push({ rule, tier, file, line: lineOf(src, index), message });
  };

  for (const m of src.matchAll(CLASS_RE)) {
    const tokens = (m[1] ?? m[2] ?? m[3]).split(/\s+/).filter(Boolean);
    const { tag, open } = elementAt(src, m.index);
    const bold = tokens.some((t) => /font-(?:bold|extrabold|black)$/.test(t));
    const large = tokens.some((t) => LARGE_RE.test(t) || (bold && BOLD_XL_RE.test(t)));
    // Background per variant prefix ('' = base, 'hover:' ...), from this element only.
    const bgs = new Map();
    for (const t of tokens) {
      const bm = BG_TOKEN_RE.exec(t);
      if (bm && palette[bm[2]]) bgs.set(bm[1], bm[2]);
    }

    for (const t of tokens) {
      const tm = TEXT_TOKEN_RE.exec(t);
      if (!tm || !palette[tm[2]]) continue;
      const bgName = bgs.get(tm[1]) ?? bgs.get('') ?? 'cream';
      // Light-on-dark text with no background on the element: the parent is dark.
      if (SKIP_FG.has(tm[2]) && !bgs.has(tm[1]) && !bgs.has('')) continue;
      const isIcon = ICON_TAGS.has(tag) || tm[1].includes('marker:');
      const bg = palette[bgName];
      const fg = tm[3] ? blend(palette[tm[2]], bg, Number(tm[3]) / 100) : palette[tm[2]];
      const ratio = contrast(fg, bg);
      const min = isIcon || large ? MIN_MARK : MIN_TEXT;
      if (ratio >= min) continue;
      const what = `${t} on ${bgName} is ${ratio.toFixed(2)}:1 (needs ${min})`;
      let hint = '';
      if (tm[2] === 'accent') hint = ` Try ${tm[1]}text-accent-dark.`;
      else if (bgName === 'accent') hint = ' Try bg-accent-dark.';
      if (!isIcon) {
        add('low-contrast-text', 'floor', m.index, `${what}.${hint}`);
      } else if (tm[1].includes('marker:')) {
        add('low-contrast-icon', 'reflex', m.index, `${what}.${hint}`);
      } else if (/aria-hidden/.test(open)) {
        add('low-contrast-icon', 'finish', m.index, `${what}; decorative, so allowed.`);
      } else {
        add('low-contrast-icon', 'reflex', m.index, `${what}. Add aria-hidden if decorative.`);
      }
    }

    const removesOutline = tokens.some((t) => /^(?:[\w-]+:)*outline-none$/.test(t));
    const hasRing = tokens.some((t) => /^(?:focus|focus-visible|focus-within):ring/.test(t));
    // A skip link that appears on focus is its own focus indicator.
    const appearsOnFocus = tokens.includes('sr-only') && tokens.includes('focus:not-sr-only');
    if (removesOutline && !hasRing && !appearsOnFocus) {
      add('focus-removed', 'floor', m.index, 'outline removed with no focus ring to replace it.');
    }

    if (tokens.includes('uppercase') && tokens.some((t) => t.startsWith('tracking-'))) {
      if (!allow.has('eyebrow-overuse')) eyebrows.push({ file, line: lineOf(src, m.index) });
    }
  }

  for (const m of src.matchAll(/\p{Extended_Pictographic}/gu)) {
    if (NOT_EMOJI.has(m[0])) continue;
    add('emoji-icon', 'floor', m.index, `emoji "${m[0]}" used in markup; use an SVG icon.`);
  }

  for (const m of src.matchAll(HEX_ATTR_RE)) {
    add('raw-hex', 'reflex', m.index, 'raw hex colour; use a palette token or currentColor.');
  }

  return { findings, eyebrows };
}

/** Cross-file rule: tracked-caps labels above many headings read as template. */
export function eyebrowFindings(eyebrows, limit = EYEBROW_LIMIT) {
  if (eyebrows.length <= limit) return [];
  return eyebrows.map(({ file, line }) => ({
    rule: 'eyebrow-overuse',
    tier: 'reflex',
    file,
    line,
    message: `tracked-caps label ${eyebrows.length} times (limit ${limit}); keep the ones that earn it.`,
  }));
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.name.endsWith('.tsx') ? [p] : [];
  });
}

export function lintProject(root = ROOT) {
  const files = SCAN_DIRS.flatMap((d) => walk(join(root, d)));
  const findings = [];
  const eyebrows = [];
  for (const path of files) {
    const res = lintSource(relative(root, path), readFileSync(path, 'utf8'));
    findings.push(...res.findings);
    eyebrows.push(...res.eyebrows);
  }
  findings.push(...eyebrowFindings(eyebrows));
  return { files: files.length, findings };
}

const TIERS = [
  ['floor', 'FLOOR - must fix before shipping'],
  ['reflex', 'REFLEX - fix, or keep with a `design-lint allow <rule>: <why>` comment'],
  ['finish', 'FINISH - craft notes, never block'],
];

function main() {
  const { files, findings } = lintProject();
  console.log(`design-lint: ${files} files checked\n`);
  for (const [tier, heading] of TIERS) {
    const list = findings.filter((f) => f.tier === tier);
    console.log(`${heading} (${list.length})`);
    for (const f of list) console.log(`  ${f.file}:${f.line}  ${f.rule}  ${f.message}`);
    console.log('');
  }
  const floor = findings.filter((f) => f.tier === 'floor').length;
  console.log(floor ? `FAIL: ${floor} floor issue(s).` : 'PASS: no floor issues.');
  if (floor) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
