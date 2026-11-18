# Observability (errors, page speed, analytics)

## What is live today

- **Vercel Analytics** (`@vercel/analytics`) and **Speed Insights** (`@vercel/speed-insights`) run in `app/[locale]/layout.tsx`. Speed Insights is where the real page-speed numbers (LCP, INP, CLS) are today. The contact form sends `contact_form_submitted`, `contact_form_failed` and `contact_form_blocked` (spam guard) events.
- **Sentry is wired but OFF.** The SDK (`@sentry/nextjs`) is installed and configured in `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` and `app/global-error.tsx`, but every `Sentry.init` has `enabled: !!DSN`. As of 2026-10-31 no DSN is set in the Vercel project (only `GITHUB_TOKEN` is), and the `jvdigital` Sentry org has no project for this site (only `emmalina-brand`). So no errors or vitals reach Sentry.

## What it would take to turn Sentry on (all free tier)

1. In Sentry (org `jvdigital`), create a Next.js project, e.g. `jvd-site`. This is an account action for John.
2. In Vercel, project `john-vincent-digital`, add `NEXT_PUBLIC_SENTRY_DSN` (Production + Preview) with the project's DSN. The DSN is public by design, but set it in Vercel, not in git.
3. Optional, for readable stack traces: add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG=jvdigital` and `SENTRY_PROJECT=jvd-site` so `withSentryConfig` in `next.config.mjs` uploads source maps at build time.
4. Page-speed numbers in Sentry: add `Sentry.browserTracingIntegration()` to the `integrations` array in `instrumentation-client.ts` and a `tracesSampleRate` (0.2 matches the server). Sentry then records Web Vitals on page loads. Until step 1 and 2 are done this does nothing, which is why it is not added yet.
5. Check: trigger an error on a preview deploy and confirm it shows up in Sentry.

The CSP in `next.config.mjs` already allows `https://*.ingest.sentry.io` and `https://*.ingest.us.sentry.io` in `connect-src` and `blob:` workers (Session Replay), so nothing else needs to change.
