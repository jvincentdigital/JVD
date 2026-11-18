import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { siteUrl } from '@/lib/site';
import SmoothScroll from '@/components/motion/SmoothScroll';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const locales = ['en', 'es'];

const motionGate =
  "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-ok')}catch(e){}";

const meta: Record<string, { title: string; description: string }> = {
  en: {
    title: 'John Vincent Digital — Web Design & Brand Strategy',
    description:
      'AI-powered web design, e-commerce, and brand strategy for Puerto Rico businesses and growing brands.',
  },
  es: {
    title: 'John Vincent Digital — Diseño Web y Estrategia de Marca',
    description:
      'Diseño web impulsado por IA, e-commerce y estrategia de marca para negocios en Puerto Rico y marcas en crecimiento.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = meta[locale] ?? meta.en;
  const ogLocale = locale === 'es' ? 'es_ES' : 'en_US';

  return {
    metadataBase: new URL(siteUrl),
    title: t.title,
    description: t.description,
    icons: {
      icon: '/icon.svg',
      apple: '/apple-icon.svg',
    },
    openGraph: {
      title: t.title,
      description: t.description,
      type: 'website',
      locale: ogLocale,
      siteName: 'John Vincent Digital',
      url: `${siteUrl}/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        es: `${siteUrl}/es`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  const t = meta[locale] ?? meta.en;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'John Vincent Digital',
    description: t.description,
    url: siteUrl,
    email: 'iamjohnvdiaz@gmail.com',
    areaServed: 'Puerto Rico',
    serviceType: ['Web Design', 'E-Commerce Development', 'Brand Identity', 'Digital Strategy'],
    knowsLanguage: ['en', 'es'],
  };

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body className='bg-cream font-sans text-charcoal antialiased'>
        <script
          // Runs before first paint: opt in to entrance motion unless reduced motion is asked for.
          dangerouslySetInnerHTML={{ __html: motionGate }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <SmoothScroll />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
