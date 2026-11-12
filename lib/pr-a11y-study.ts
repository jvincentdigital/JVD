// Totals from our own scan of Puerto Rico small business home pages (jvd-a11y-scanner).
// Only totals live here. The per-site results are kept outside this repo on purpose.
export const study = {
  date: '2026-11-12',
  sample: 40,
  axeVersion: '4.11.3',
  // Of the sample, how many are restaurants, cafes or bars.
  food: 36,
  // Listed websites that did not load or blocked the scan, skipped and not counted.
  replaced: 12,
  // Home pages with at least one problem rated critical or serious.
  failing: 30,
  // Problems found on the most home pages, most first. `key` matches messages `study.problems`.
  // Fifth place is a tie, so there are six rows.
  top: [
    { key: 'lowContrast', sites: 21 },
    { key: 'emptyLinks', sites: 15 },
    { key: 'frameTitles', sites: 7 },
    { key: 'imageAlt', sites: 6 },
    { key: 'formLabels', sites: 4 },
    { key: 'emptyButtons', sites: 4 },
  ],
};

// Rank with ties: rows with the same count share a number (1, 2, 3, 4, 5, 5).
export function rankOf(i: number): number {
  return study.top.findIndex((row) => row.sites === study.top[i].sites) + 1;
}
