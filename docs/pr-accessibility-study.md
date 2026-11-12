# PR accessibility study page

`/[locale]/pr-accessibility-study` shows totals from our own scan of Puerto Rico small business home pages. Lab page (draft PR), not linked from the home page yet.

- Numbers live in `lib/pr-a11y-study.ts`; all copy, including the plain-words problem names, lives in `messages/*.json` under `study`.
- Totals only. Never put a business name or a per-site result in this repo. The per-site list is in `jvd-outputs/2026-11-12/a11y-stats/` (leads.csv, scanner reports, README with the method).
- Scan used: jvd-a11y-scanner dist, axe-core 4.11.3, WCAG 2.1 A and AA tags, home page only, desktop viewport, run 2026-11-12.
- "Fails basic checks" means at least one problem the scanner rates critical or serious.

## Refreshing the numbers

1. Rescan the same list with the scanner, writing reports outside the scanner checkout.
2. Update `study` in `lib/pr-a11y-study.ts` (date, sample, food, replaced, failing, top). If the top problems change, add their names to `study.problems` in both message files.
3. Only compare runs with the same axe-core version (see the scanner's docs/output-contract.md).
