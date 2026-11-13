import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),

  tracesSampleRate: 0.2,

  // The free accessibility checker fetches the address a visitor typed. Keep
  // those requests out of spans and breadcrumbs, so the URL never reaches Sentry.
  integrations: [
    Sentry.httpIntegration({
      ignoreOutgoingRequests: (_url, req) => {
        // Spans get our own options (User-Agent); breadcrumbs get getHeaders() (user-agent).
        const headers = req.headers as Record<string, unknown> | undefined;
        const agent = headers?.['User-Agent'] ?? headers?.['user-agent'];
        return String(agent ?? '').startsWith('JVD-QuickCheck');
      },
    }),
  ],

  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
});
