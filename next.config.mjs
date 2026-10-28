import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const cspWith = (frameAncestors) =>
  [
    "default-src 'self'",
    // cdn.jsdelivr.net: three.js for the 3D QR demos (lib/burst-qr), loaded only on those pages.
  // connect-src blob: lets three.js read textures packed inside .glb models (public/lab/models).
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' blob: https://formspree.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self' https://formspree.io",
    'upgrade-insecure-requests',
  ].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspWith("'none'") },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // the 3D QR gallery shows the static demo pages in /public/lab in a frame, from this site only
      {
        source: '/lab/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspWith("'self'") },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  silent: !process.env.SENTRY_DSN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
});
