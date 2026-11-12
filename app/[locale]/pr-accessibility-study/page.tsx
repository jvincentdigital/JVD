import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { rankOf, study } from '@/lib/pr-a11y-study';
import { siteUrl } from '@/lib/site';

type Params = { locale: 'en' | 'es' };

const path = 'pr-accessibility-study';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'study' });
  const title = `${t('title')} | John Vincent Digital`;
  const description = t('dek', { sample: study.sample });

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
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

function pct(n: number) {
  return `${Math.round((n / study.sample) * 100)}%`;
}

export default async function StudyPage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'study' });
  const date = new Intl.DateTimeFormat(locale === 'es' ? 'es-PR' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(study.date));

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
                    className='-my-3 inline-block rounded py-3 transition-colors hover:text-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
                  >
                    {t('breadcrumbHome')}
                  </Link>
                </li>
                <li aria-hidden='true'>/</li>
                <li aria-current='page' className='text-charcoal'>
                  {t('breadcrumbStudy')}
                </li>
              </ol>
            </nav>
            <p className='mt-8 text-xs font-medium uppercase tracking-widest text-accent-dark'>
              {t('eyebrow', { date })}
            </p>
            <h1 className='mt-3 font-serif text-4xl font-bold leading-tight text-charcoal sm:text-5xl'>
              {t('title')}
            </h1>
            <p className='mt-5 text-lg leading-relaxed text-warm-gray'>
              {t('dek', { sample: study.sample })}
            </p>
          </div>
        </header>

        <div className='mx-auto max-w-3xl space-y-14 px-4 py-14'>
          <section aria-labelledby='headline-stat'>
            <div className='rounded-xl border border-border bg-white p-6 sm:p-8'>
              <p id='headline-stat' className='font-serif text-5xl font-bold text-charcoal'>
                {t('failingCount', { failing: study.failing, sample: study.sample })}
              </p>
              <p className='mt-3 text-lg leading-relaxed text-charcoal'>{t('failingLabel')}</p>
              <div aria-hidden='true' className='mt-6 h-2 overflow-hidden rounded-full bg-cream'>
                <div
                  className='h-full rounded-full bg-accent-dark'
                  style={{ width: pct(study.failing) }}
                />
              </div>
              <p className='mt-4 text-sm leading-relaxed text-warm-gray'>
                {t('passing', { passing: study.sample - study.failing })}
              </p>
            </div>
          </section>

          <section aria-labelledby='top-problems'>
            <h2
              id='top-problems'
              className='font-serif text-2xl font-bold text-charcoal sm:text-3xl'
            >
              {t('topHeading')}
            </h2>
            <p className='mt-3 leading-relaxed text-warm-gray'>{t('topIntro')}</p>
            <ol className='mt-8 space-y-6'>
              {study.top.map(({ key, sites }, i) => (
                <li key={key} className='border-b border-border pb-6 last:border-b-0'>
                  <div className='flex items-baseline justify-between gap-4'>
                    <h3 className='font-sans text-lg font-semibold text-charcoal'>
                      <span className='mr-2 text-accent-dark'>{rankOf(i)}.</span>
                      {t(`problems.${key}.name`)}
                    </h3>
                    <p className='shrink-0 text-sm font-medium text-charcoal'>
                      {t('sitesCount', { sites, sample: study.sample })}
                    </p>
                  </div>
                  <p className='mt-2 leading-relaxed text-warm-gray'>{t(`problems.${key}.why`)}</p>
                  <div
                    aria-hidden='true'
                    className='mt-3 h-1.5 overflow-hidden rounded-full bg-white'
                  >
                    <div
                      className='h-full rounded-full bg-accent-dark'
                      style={{ width: pct(sites) }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby='method'
            className='rounded-xl border border-border bg-white p-6 sm:p-8'
          >
            <h2 id='method' className='font-serif text-2xl font-bold text-charcoal'>
              {t('methodHeading')}
            </h2>
            <dl className='mt-4 space-y-4'>
              {(
                [
                  ['sampleLabel', 'sample'],
                  ['dateLabel', 'date'],
                  ['checkedLabel', 'checked'],
                  ['scopeLabel', 'scope'],
                ] as const
              ).map(([label, value]) => (
                <div key={value}>
                  <dt className='font-semibold text-charcoal'>{t(`methodRows.${label}`)}</dt>
                  <dd className='mt-1 leading-relaxed text-warm-gray'>
                    {t(`methodRows.${value}`, {
                      sample: study.sample,
                      food: study.food,
                      replaced: study.replaced,
                      date,
                      axeVersion: study.axeVersion,
                    })}
                  </dd>
                </div>
              ))}
            </dl>
            <p className='mt-4 leading-relaxed text-warm-gray'>{t('methodLimits')}</p>
            <p className='mt-4 leading-relaxed text-warm-gray'>{t('privacy')}</p>
          </section>

          <div>
            <Link
              href={`/${locale}?service=accessibility#contact`}
              className='inline-flex items-center justify-center rounded-lg bg-accent-dark px-6 py-3 font-medium text-white transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
