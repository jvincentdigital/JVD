# Free accessibility check page

`/en/free-accessibility-check` and `/es/free-accessibility-check`. A visitor types a website address, gets a short accessibility summary in a few seconds, and can leave an email to ask for the full audit. Lab feature (draft PR), not linked from the home page yet.

## How it works

1. `components/A11yChecker.tsx` (client) posts `{ url }` to `/api/a11y-check`.
2. `app/api/a11y-check/route.ts` (Node runtime, `maxDuration` 30 s):
   - rate limit: 5 checks per IP per 10 minutes, in memory (`lib/a11y-check/rate-limit.ts`). Each Vercel instance keeps its own count, so it slows abuse but is not exact.
   - `parseTarget` (`lib/a11y-check/url-guard.ts`): http/https only, no user:pass, ports 80/443 only, no localhost/.local/.internal names, no private IP literals.
   - `fetchPage` (`lib/a11y-check/fetch-page.ts`): Node `http(s).request` with a custom `lookup` that refuses any host whose DNS answers include a private, loopback, link-local (cloud metadata), CGNAT, multicast or reserved address. The check runs inside the socket's own lookup, so DNS rebinding cannot slip past it. Redirects are followed by hand (max 3), each hop checked again. 8 s total timeout, 2 MB cap counted after decompression, HTML content types only.
   - `runAxe` (`lib/a11y-check/run-axe.ts`): axe-core 4.11.3 inside jsdom with `runScripts: 'outside-only'`, so the page's own scripts never run and jsdom loads no images, CSS or frames. WCAG 2.0/2.1 A and AA rules.
   - `summarize` (`lib/a11y-check/summary.ts`): counts per impact and the top 5. Only rule ids and counts go back to the browser.
3. Plain one-line explanations per rule live in `messages/{en,es}.json` under `checker.rules`. Rules not listed in `EXPLAINED_RULES` fall back to the shared `aria` or `other` line. A test checks every listed rule has both languages.

## What the quick check cannot do

No real browser, so no layout and no colors. Turned off on purpose (`NEEDS_A_BROWSER`): color-contrast, link-in-text-block, scrollable-region-focusable, target-size. Also not seen: content added by JavaScript after load, keyboard flow, screen reader flow, other pages. Pages with very little text and some scripts get a "thin" note. A headless browser (Puppeteer + Chromium) would cover contrast, but it is heavy for a Vercel Hobby function and slower; the full audit (jvd-a11y-scanner) covers it.

## Leads

The email form posts from the browser straight to the site's existing Formspree form (same id as the contact form, `NEXT_PUBLIC_FORMSPREE_ID`), like `components/Contact.tsx`. The email never reaches our server, so it cannot show up in our logs. Subject: "Free accessibility check: full audit request", with the website, language, and a one-line summary of the result. Honeypot + 3 second minimum fill time, as on the contact form.

## Privacy

The fetched HTML lives only in memory for the request. Nothing is stored. The route logs only an error code on server errors, never the URL or an email.

## Dependencies

`axe-core` and `jsdom` are runtime dependencies (jsdom moved from dev). Both are listed in `experimental.serverComponentsExternalPackages` in `next.config.mjs` so Next does not bundle them.
