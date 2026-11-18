# Motion (lab branch `lab/motion-polish`)

Status: LAB ONLY. Not on the live site until John says yes.

## What runs where

- `components/motion/gsap.ts`: registers GSAP plugins (ScrollTrigger, SplitText, useGSAP) once.
- `components/motion/SmoothScroll.tsx`: Lenis smooth scroll, loaded after hydration and driven by
  the GSAP ticker. Same-page anchor links go through Lenis, then update the URL hash and move focus
  to the target section (keyboard and screen reader users land where a native jump would put them).
- `components/motion/SplitText.tsx`: trimmed copy of React Bits SplitText. Used once, for the hero
  headline. Reverts to plain text after the entrance.
- `components/ScrollReveal.tsx`: section reveals on ScrollTrigger. Content is server-rendered
  visible and only hidden once JS runs.
- `app/[locale]/layout.tsx`: a one-line inline script adds `motion-ok` to `<html>` before paint
  unless `prefers-reduced-motion: reduce`. CSS hides `[data-motion='pending']` only under that class,
  with a 2.5s CSS failsafe.

## Rules

- Reduced motion: no Lenis, no reveals, no hero entrance. Everything is static and visible.
- Animate transform and opacity only. One signature moment (the hero); the rest is quiet.
- Do not add more React Bits components to `@jvd/ui` or to anything sold as a template: its
  license forbids redistributing the components themselves (see Licenses).

## Licenses

| Library                                | License                                | Commercial site use                                                                                                                     |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GSAP 3.15                              | GreenSock standard "no charge" license | Yes, all plugins included. Not for building no-code visual animation tools that compete with Webflow. https://gsap.com/standard-license |
| Lenis                                  | MIT                                    | Yes                                                                                                                                     |
| React Bits SplitText (copied, adapted) | MIT + Commons Clause                   | Yes inside a website or app; do not sell or redistribute the component itself. Notice kept in the file header.                          |

## Gotchas

- SplitText word masks clip descenders (y, g, p) with tight line-height; `.split-word-mask` has
  bottom padding and the split is reverted when the entrance ends.
- The a11y scanner and axe only see revealed content. Scan with `reducedMotion: 'reduce'` to see the
  whole page.
