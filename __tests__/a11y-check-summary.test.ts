import { describe, it, expect } from 'vitest';
import en from '../messages/en.json';
import es from '../messages/es.json';
import { EXPLAINED_RULES, ruleKey, summarize } from '../lib/a11y-check/summary';
import { clientIp, createRateLimiter } from '../lib/a11y-check/rate-limit';

describe('summarize', () => {
  it('reports nothing for a clean page', () => {
    const s = summarize([]);
    expect(s.problems).toBe(0);
    expect(s.places).toBe(0);
    expect(s.top).toEqual([]);
    expect(s.byImpact.critical).toEqual({ problems: 0, places: 0 });
  });

  it('counts kinds and places per impact', () => {
    const s = summarize([
      { id: 'image-alt', impact: 'critical', nodes: 4 },
      { id: 'label', impact: 'critical', nodes: 2 },
      { id: 'link-name', impact: 'serious', nodes: 7 },
      { id: 'heading-order', impact: 'moderate', nodes: 1 },
    ]);
    expect(s.problems).toBe(4);
    expect(s.places).toBe(14);
    expect(s.byImpact.critical).toEqual({ problems: 2, places: 6 });
    expect(s.byImpact.serious).toEqual({ problems: 1, places: 7 });
    expect(s.byImpact.moderate).toEqual({ problems: 1, places: 1 });
    expect(s.byImpact.minor).toEqual({ problems: 0, places: 0 });
  });

  it('puts the worst first, then the most places, and keeps only five', () => {
    const s = summarize([
      { id: 'list', impact: 'serious', nodes: 30 },
      { id: 'image-alt', impact: 'critical', nodes: 1 },
      { id: 'button-name', impact: 'critical', nodes: 5 },
      { id: 'meta-viewport', impact: 'moderate', nodes: 1 },
      { id: 'document-title', impact: 'serious', nodes: 1 },
      { id: 'blink', impact: 'minor', nodes: 9 },
      { id: 'bypass', impact: 'serious', nodes: 1 },
    ]);
    expect(s.top.map((p) => p.rule)).toEqual([
      'button-name',
      'image-alt',
      'list',
      'bypass',
      'document-title',
    ]);
  });

  it('treats a missing impact as moderate and skips empty rules', () => {
    const s = summarize([
      { id: 'mystery', impact: null, nodes: 2 },
      { id: 'label', impact: 'critical', nodes: 0 },
    ]);
    expect(s.problems).toBe(1);
    expect(s.top[0]).toEqual({ rule: 'mystery', impact: 'moderate', places: 2 });
  });
});

describe('ruleKey and the plain explanations', () => {
  const rules = (m: unknown) => (m as { checker: { rules: Record<string, string> } }).checker.rules;

  it('has an EN and ES line for every explained rule, plus the fallbacks', () => {
    for (const key of [...EXPLAINED_RULES, 'aria', 'other']) {
      expect(rules(en)[key], `en ${key}`).toBeTruthy();
      expect(rules(es)[key], `es ${key}`).toBeTruthy();
    }
  });

  it('falls back to the aria or other line', () => {
    expect(ruleKey('image-alt')).toBe('image-alt');
    expect(ruleKey('aria-meter-name')).toBe('aria');
    expect(ruleKey('something-new')).toBe('other');
  });

  it('uses no em or en dashes in the checker copy', () => {
    expect(JSON.stringify((en as { checker: unknown }).checker)).not.toMatch(/[–—]/);
    expect(JSON.stringify((es as { checker: unknown }).checker)).not.toMatch(/[–—]/);
  });
});

describe('createRateLimiter', () => {
  it('allows the limit, blocks the next, and resets after the window', () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(allow('1.2.3.4', 0)).toBe(true);
    expect(allow('1.2.3.4', 10)).toBe(true);
    expect(allow('1.2.3.4', 20)).toBe(false);
    expect(allow('5.6.7.8', 20)).toBe(true);
    expect(allow('1.2.3.4', 1011)).toBe(true);
  });
});

describe('clientIp', () => {
  const ip = (value: string) => clientIp(new Headers({ 'x-forwarded-for': value }));

  it('keeps an IPv4 address as it is', () => {
    expect(ip('203.0.114.7, 10.0.0.1')).toBe('203.0.114.7');
  });

  it('puts every address in one IPv6 /64 under one key', () => {
    const key = '2600:1700:abcd:12::/64';
    expect(ip('2600:1700:abcd:12::1')).toBe(key);
    expect(ip('2600:1700:abcd:0012:9f3e:1:2:3')).toBe(key);
    expect(ip('2600:1700:abcd:12:ffff::')).toBe(key);
    expect(ip('2600:1700:abcd:13::1')).not.toBe(key);
    expect(ip('2600::1')).toBe('2600:0:0:0::/64');
  });
});
