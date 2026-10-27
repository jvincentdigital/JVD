# Plaza night report: 10 trending repos for Claude

Idea sent 2026-10-21 by @usamaakrm ([TikTok](https://www.tiktok.com/t/ZPLAryfUs/)). Built 2026-10-26 on branch `lab/night-2026-10-26-10-trending-repos-for-claude`. Draft, do not merge.

## What the idea is

A list of ten popular open-source add-ons for Claude Code. Your plan was to fold the ideas from **Hallmark** and **UI/UX Pro Max** into a design-polish skill, and to build our own version of **Diagram Design**. All three are MIT-licensed, free, and need no sign-up, so I built it.

What the other seven are, for the record (not built):

- **Impeccable** (Apache-2.0): another design skill against the "AI look". It overlaps with Hallmark, so I skipped it.
- **Humanizer** (blader/humanizer): rewrites text to remove AI writing patterns. Could help with site copy later.
- **Last 30 Days** (MIT): researches Reddit, X, YouTube and others for the last 30 days. Not a website task.
- **Ponytail** (MIT): tells the agent to reuse existing code before writing new code.
- **Scrapling** (BSD-3-Clause): a Python web scraper. Not needed for JVD.
- **Onyx**: a self-hosted AI chat platform. Its license is reported as custom, so it needs checking before any use. Not needed.
- **REA**: I could not find which repo this is.

## What I built (all free, no new packages)

1. **Design linter**: `scripts/design/lint.mjs`. It scans `components/` and `app/` and sorts findings into three tiers (the Hallmark idea):
   - **Floor** (must fix): text contrast below WCAG AA in any state (hover, focus, group-hover), an outline removed with no focus ring, emoji used as icons.
   - **Reflex** (fix, or keep with a written reason): too many tracked-caps "eyebrow" labels, raw hex colours, icons and bullet markers below 3:1.
   - **Finish** (notes only).

   The contrast numbers are computed from the real JVD colours.
2. **Diagram renderer**: `scripts/design/diagram.mjs`. You write a short JSON file listing boxes and arrows, and it writes one HTML file with an SVG diagram in JVD colours that opens offline. It enforces the diagram-design house rules: 4px grid, accent on at most 2 boxes, no shadows, at most 12 boxes, every colour pair contrast-checked. It also writes a screen-reader description. Example: `docs/diagrams/request-flow.json` → `docs/diagrams/request-flow.html`, the request flow from `docs/architecture.md`.
3. **Two skills**, written in our own words: `docs/skills/design-polish/SKILL.md` (audit / polish / redesign modes, tiers, a pre-delivery checklist at 375/768/1024/1440px) and `docs/skills/diagram/SKILL.md`.
4. **Self-test**: `scripts/design/selftest.mjs`, 16 checks.
5. `make design-lint`, `make diagrams` and `make design-test` targets, a short note in `CLAUDE.md`, and the generated diagram HTML added to `.prettierignore`.

**A decision you need to know about:** the sandbox blocked writing into `.claude/skills/`, so the skills are staged in `docs/skills/` and not active yet. If you like them, copy the two folders into `.claude/skills/`. If you already have a `design-polish` skill outside this repo, merge the "Tiers" and "Pre-delivery checklist" sections into it instead; I could not see it from here.

## What the linter found on the live site (real, not fixed)

I did not change any site code: these are colour choices, so they are your call. Each one is a one-class swap:

- `text-accent` (#00A86B) on cream is **2.72:1**; text needs 4.5:1 (3:1 when large). It appears in the hover states in `components/CaseStudyHero.tsx:20` and `app/[locale]/work/[slug]/page.tsx:156` and `:179`, and in the big "404" / "Oops" in `app/[locale]/not-found.tsx:9` and `app/[locale]/error.tsx:19`. Fix: `text-accent-dark` (4.76:1).
- White text on `bg-accent` is **3.08:1**. It appears in the 404 and error page buttons (`not-found.tsx:16`, `error.tsx:28`) and the "skip to content" link (`app/[locale]/page.tsx:18`, `work/[slug]/page.tsx:96`). Fix: `bg-accent-dark` (5.40:1).
- Reflex: 6 tracked-caps eyebrow labels site-wide (the linter allows 3). The Services icons and approach bullets use `text-accent` below 3:1 and are not marked `aria-hidden`. There is one raw hex in `Hero.tsx:66`.

These overlap with the `[~]` "Sweep the rest of the site for text-accent" item in `TODO.md`. The linter shows which ones are still left.

## How to try it

1. Open a terminal in the JVD repo and check out this branch.
2. Run `make design-test`. You should see 16 passing checks.
3. Run `make design-lint`. You get the list above. It ends with `FAIL: 9 floor issue(s)` until the colours are fixed.
4. Open `docs/diagrams/request-flow.html` in your browser to see the example diagram.
5. To make your own: copy `docs/diagrams/request-flow.json` to a new name, edit the boxes and arrows, run `make diagrams`, then open the new `.html`.
6. To turn on the skills: copy `docs/skills/design-polish` and `docs/skills/diagram` into `.claude/skills/`, then ask Claude to "audit the design" or "draw how the contact form works".

## What I checked

- `node scripts/design/selftest.mjs`: 16/16 pass. It covers the contrast maths against WCAG reference values, each lint rule (including that floor rules cannot be "allowed" away), the diagram rules (cycles, skipped layers, too many boxes, too many accents), the 4px grid, escaping, no scripts or external URLs in the output, and that the committed HTML matches its JSON. One real bug was caught and fixed: an allow comment with an empty reason was being accepted.
- `node scripts/design/lint.mjs` on the real project. I read every floor finding in its source file to rule out false positives. I also fixed three false-positive cases along the way: large text, list markers, and skip links that appear on focus.
- `node scripts/design/diagram.mjs`: all 8 colour pairs pass. I read the output SVG by hand: the coordinates are on the grid and the fan-out/fan-in is symmetric.
- **Not checked:** `pnpm lint` and `pnpm test` cannot run in this sandbox (`next: not found`, `vitest: not found`, because no packages are installed here). Prettier was not run either, so CI's format check is the first real check of formatting. I kept lines under 100 characters to match `.prettierrc.json`. Nothing touches app code, so `pnpm build` and typecheck are unaffected (`.mjs` files are outside `tsconfig` includes). I could not open the diagram in a browser.

## What is left

- Decide on the 9 floor colour fixes (or ask Claude to apply them with the design-polish skill).
- Copy the skills into `.claude/skills/` if you want them active.
- Optional: run `make design-lint` in CI once the floor issues are fixed.
- Known limits: the linter only sees a background set on the same element (it assumes cream otherwise), and hover backgrounds are not paired with base text colours. Diagrams are top-down only, and an arrow can only go to the next row.

## Sources

- Hallmark, MIT: <https://github.com/nutlope/hallmark>
- UI UX Pro Max, MIT: <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>
- diagram-design, MIT: <https://github.com/cathrynlavery/diagram-design>
- Impeccable, Apache-2.0 (per reviews): <https://emelia.io/hub/impeccable-design-skill-review>
- last30days, MIT: <https://claudemarketplaces.com/skills/mvanhorn/last30days-skill/last30days>
- Humanizer: <https://gigazine.net/gsc_news/en/20260530-humanizer>
- Ponytail, MIT (per guide): <https://skillselion.com/guides/ponytail-skill-claude-code-guide>
- Scrapling, BSD-3-Clause and Onyx license note: <https://trendshift.io/repositories/12516>
- WCAG contrast rules: 1.4.3 (text 4.5:1, large 3:1) and 1.4.11 (non-text 3:1)

The original TikTok page could not be read (it returned only a page title), so the list above comes from your Plaza note plus web search. No page I read tried to give instructions to me. UI UX Pro Max's README tells agents not to install it for the user; I didn't install anything. No code, brand names or assets were copied. Only ideas were taken, with MIT credit in each file's header.
