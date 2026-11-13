// Turns raw axe-core results into the short, score-free summary the page shows.
// Only rule ids and counts leave the server: never the page's HTML or text.

export type Impact = 'critical' | 'serious' | 'moderate' | 'minor';

export const IMPACTS: Impact[] = ['critical', 'serious', 'moderate', 'minor'];

export type RawViolation = { id: string; impact: string | null; nodes: number };

export type Problem = { rule: string; impact: Impact; places: number };

export type Summary = {
  /** Kinds of problems found (one per axe rule). */
  problems: number;
  /** Places on the page with a problem, summed over all kinds. */
  places: number;
  byImpact: Record<Impact, { problems: number; places: number }>;
  /** The five that matter most: worst impact first, then most places. */
  top: Problem[];
};

/**
 * Rules with their own plain one-line explanation in messages/{en,es}.json
 * under checker.rules. Other aria-* rules share the "aria" line; anything
 * else gets the "other" line.
 */
export const EXPLAINED_RULES = [
  'image-alt',
  'input-image-alt',
  'role-img-alt',
  'svg-img-alt',
  'area-alt',
  'object-alt',
  'link-name',
  'button-name',
  'input-button-name',
  'label',
  'select-name',
  'form-field-multiple-labels',
  'label-content-name-mismatch',
  'frame-title',
  'frame-title-unique',
  'frame-focusable-content',
  'document-title',
  'html-has-lang',
  'html-lang-valid',
  'valid-lang',
  'html-xml-lang-mismatch',
  'meta-viewport',
  'meta-refresh',
  'list',
  'listitem',
  'definition-list',
  'dlitem',
  'duplicate-id-aria',
  'nested-interactive',
  'bypass',
  'autocomplete-valid',
  'blink',
  'marquee',
  'server-side-image-map',
  'video-caption',
  'audio-caption',
  'no-autoplay-audio',
  'td-headers-attr',
  'td-has-header',
  'th-has-data-cells',
  'table-fake-caption',
  'p-as-heading',
  'summary-name',
  'avoid-inline-spacing',
  'css-orientation-lock',
  'aria-hidden-body',
  'aria-hidden-focus',
] as const;

const explained = new Set<string>(EXPLAINED_RULES);

/** The messages key for a rule's one-line explanation. */
export function ruleKey(rule: string): string {
  if (explained.has(rule)) return rule;
  return rule.startsWith('aria-') ? 'aria' : 'other';
}

function toImpact(value: string | null): Impact {
  return (IMPACTS as string[]).includes(value ?? '') ? (value as Impact) : 'moderate';
}

export function summarize(violations: RawViolation[], topCount = 5): Summary {
  const problems: Problem[] = violations
    .filter((v) => v.nodes > 0)
    .map((v) => ({ rule: v.id, impact: toImpact(v.impact), places: v.nodes }));

  const byImpact = Object.fromEntries(
    IMPACTS.map((impact) => [impact, { problems: 0, places: 0 }]),
  ) as Summary['byImpact'];
  for (const p of problems) {
    byImpact[p.impact].problems += 1;
    byImpact[p.impact].places += p.places;
  }

  const rank = (i: Impact) => IMPACTS.indexOf(i);
  const top = [...problems]
    .sort(
      (a, b) =>
        rank(a.impact) - rank(b.impact) || b.places - a.places || a.rule.localeCompare(b.rule),
    )
    .slice(0, topCount);

  return {
    problems: problems.length,
    places: problems.reduce((sum, p) => sum + p.places, 0),
    byImpact,
    top,
  };
}
