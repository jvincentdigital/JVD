---
name: design-polish
description: Polish, audit or redesign JVD UI so it reads as hand-made, not generated. Use before shipping any visual change, or when asked to "polish", "audit the design", "redesign" a section, or "make it look less AI".
---

# design-polish

A JVD-specific design pass. It keeps the site's own look (cream / charcoal / green, Fraunces + Plus Jakarta Sans) and removes the habits that make a page look template-made.

Ideas borrowed, in our own words: the floor / reflex / finish tiers, audit-only mode and "keep the wiring" redesigns come from Hallmark (MIT, github.com/nutlope/hallmark). The pre-delivery checklist and "one master design file" come from UI UX Pro Max (MIT, github.com/nextlevelbuilder/ui-ux-pro-max-skill). No code or assets were copied.

## Pick a mode

- `audit` - report only. Run the linter, walk the checklist, list findings by tier. Change nothing.
- `polish` (default) - fix floor issues, fix or justify reflex issues, then finish notes if time allows.
- `redesign <section>` - new layout, same content and wiring. Before you start, write down the section's links, form fields, event handlers, headings, section `id`s and translation keys. After, check every one still exists.

## Pre-flight (every mode)

1. Read `tailwind.config.ts`, `app/globals.css` and the Conventions in `CLAUDE.md`. These are the master design file: use their tokens, never new hex values.
2. Never invent facts. No made-up stats, client names, testimonials or awards. If copy is missing, ask John or leave a clearly marked TODO.
3. Run `node scripts/design/lint.mjs` (or `make design-lint`) and keep the output.

## Tiers

**Floor - never ship.** The linter checks the first three.

- Text contrast at least 4.5:1 (3:1 for large text), in every state including `hover:` and `focus:`. On cream, `text-accent` is 2.72:1: use `text-accent-dark`. White on `bg-accent` is 3.08:1: use `bg-accent-dark`.
- Removing an outline needs a visible focus ring in its place.
- No emoji as icons; use inline SVG with `currentColor`.
- Respect `prefers-reduced-motion` (see `docs/motion.md`).
- No horizontal scroll and no clipped text at 375px.
- A form never shows "thanks" unless it really sent.

**Reflex - fix it, or keep it with a reason.** Keep one with `// design-lint allow <rule>: <why>` in that file.

- Tracked-caps "eyebrow" labels above many headings (the linter allows 3 site-wide).
- One coloured word in every headline.
- Raw hex colours in markup instead of tokens.
- Icons below 3:1 that are not marked `aria-hidden`.
- Every section the same card grid; vary rhythm across Services, Work, Pricing, About.
- A newsletter or sign-up block tacked on the end.

**Finish - craft notes, never block.**

- Balanced headings and pretty paragraph wraps (already global in `globals.css`).
- Consistent spacing steps; no one-off `mt-[13px]`.
- Decorative icons below 3:1 are fine when `aria-hidden`; prefer `accent-dark` anyway.

## Pre-delivery checklist

- [ ] `node scripts/design/lint.mjs` shows no floor issues.
- [ ] Looked at 375, 768, 1024 and 1440px wide.
- [ ] Tabbed through the changed part; focus is always visible.
- [ ] Turned on reduced motion; nothing is stuck hidden.
- [ ] Touch targets at least 44px (`min-h-11` or more).
- [ ] All new copy is in both `messages/en.json` and `messages/es.json`.
- [ ] Section `id`s unchanged (Nav depends on them).

## Report back

List findings as `file:line - tier - what - fix`. For each reflex kept, quote the reason. Put lasting design decisions in `docs/` (one topic per file), not in chat.
