import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import A11yChecker from '@/components/A11yChecker';
import { siteUrl } from '@/lib/site';

type Params = { locale: 'en' | 'es' };

const path = 'free-accessibility-check';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'checker' });
  const title = `${t('metaTitle')} | John Vincent Digital`;
  const description = t('metaDescription');

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      url: `${siteUrl}/${locale}/${path}`,
      siteName: 'John Vincent Digital',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/${path}`,
      languages: {
        en: `${siteUrl}/en/${path}`,
        es: `${siteUrl}/es/${path}`,
      },
    },
  };
}

export default async function FreeAccessibilityCheckPage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'checker' });

  return (
    <>
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-dark focus:px-4 focus:py-2 focus:text-white focus:outline-none'
      >
        {t('skip')}
      </a>
      <Nav />
      <main id='main-content' className='bg-cream'>
        <header className='border-b border-border'>
          <div className='mx-auto max-w-3xl px-4 pb-12 pt-10'>
            <nav aria-label={t('breadcrumbLabel')} className='text-sm text-warm-gray'>
              <ol className='flex items-center gap-2'>
                <li>
                  <Link
                    href={`/${locale}`}
                    className='-mx-2 -my-3 inline-block rounded px-2 py-3 transition-colors hover:text-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
                  >
                    {t('breadcrumbHome')}
                  </Link>
                </li>
                <li aria-hidden='true'>/</li>
                <li aria-current='page' className='text-charcoal'>
                  {t('breadcrumbTool')}
                </li>
              </ol>
            </nav>
            <h1 className='mt-8 font-serif text-4xl font-bold leading-tight text-charcoal sm:text-5xl'>
              {t('title')}
            </h1>
            <p className='mt-5 text-lg leading-relaxed text-warm-gray'>{t('dek')}</p>
          </div>
        </header>

        <div className='mx-auto max-w-3xl px-4 py-12 sm:py-14'>
          <A11yChecker />
        </div>
      </main>
      <Footer />
    </>
  );
}
