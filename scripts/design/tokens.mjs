// JVD colour tokens (mirrors tailwind.config.ts and app/globals.css) plus the
// WCAG contrast maths for the design linter.

export const palette = {
  cream: '#F5F0E8',
  charcoal: '#1A1A1A',
  'warm-gray': '#6B6560',
  accent: '#00A86B',
  'accent-dark': '#007A4D',
  border: '#E0D9CF',
  dark: '#111111',
  white: '#FFFFFF',
};

// WCAG 2.x minimums: normal text, and non-text marks (icons, lines, borders).
export const MIN_TEXT = 4.5;
export const MIN_MARK = 3;

function channels(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function toHex(rgb) {
  const pairs = rgb.map((c) => Math.round(c).toString(16).padStart(2, '0'));
  return '#' + pairs.join('').toUpperCase();
}

// Colour `fg` at `alpha` (0..1) painted over solid `bg`.
export function blend(fg, bg, alpha) {
  const f = channels(fg);
  const b = channels(bg);
  return toHex(f.map((c, i) => c * alpha + b[i] * (1 - alpha)));
}

export function luminance(hex) {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
