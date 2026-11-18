import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CaseStudyHero from '@/components/CaseStudyHero';
import CaseStudySection from '@/components/CaseStudySection';
import { caseStudies, getCaseStudy, getOtherCaseStudies, type Locale } from '@/lib/case-studies';
import { siteUrl } from '@/lib/site';

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return caseStudies.flatMap((cs) => [
    { locale: 'en', slug: cs.slug },
    { locale: 'es', slug: cs.slug },
  ]);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const study = getCaseStudy(params.slug);
  if (!study) return {};
  const { locale, slug } = params;
  const suffix = locale === 'es' ? 'Caso de Estudio' : 'Case Study';
  const title = `${study.client} — ${suffix} | John Vincent Digital`;
  const description = study.brief[locale];

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      url: `${siteUrl}/${locale}/work/${slug}`,
      siteName: 'John Vincent Digital',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/work/${slug}`,
      languages: {
        en: `${siteUrl}/en/work/${slug}`,
        es: `${siteUrl}/es/work/${slug}`,
      },
    },
  };
}

export default async function CaseStudyPage({ params }: { params: Params }) {
  const study = getCaseStudy(params.slug);
  if (!study) notFound();
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'caseStudy' });
  const others = getOtherCaseStudies(study.slug);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('breadcrumbHome'),
        item: `${siteUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('breadcrumbWork'),
        item: `${siteUrl}/${locale}#work`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: study.client,
        item: `${siteUrl}/${locale}/work/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-dark focus:px-4 focus:py-2 focus:text-white focus:outline-none'
      >
        Skip to content
      </a>
      <Nav />
      <main id='main-content'>
        <CaseStudyHero
          locale={locale}
          client={study.client}
          category={study.category[locale]}
          color={study.color}
          breadcrumbWork={t('breadcrumbWork')}
        />

        <div className='bg-cream'>
          <div className='mx-auto max-w-3xl space-y-12 px-4 py-16'>
            <CaseStudySection heading={t('sectionBrief')}>
              <p className='text-lg leading-relaxed text-warm-gray'>{study.brief[locale]}</p>
            </CaseStudySection>

            <CaseStudySection heading={t('sectionChallenge')}>
              <p className='leading-relaxed text-warm-gray'>{study.challenge[locale]}</p>
            </CaseStudySection>

            <CaseStudySection heading={t('sectionApproach')}>
              <ul className='list-disc space-y-3 pl-5 leading-relaxed text-warm-gray marker:text-accent'>
                {study.approach[locale].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CaseStudySection>

            <CaseStudySection heading={t('sectionOutcome')}>
              <p className='leading-relaxed text-warm-gray'>{study.outcome[locale]}</p>
            </CaseStudySection>

            <CaseStudySection heading={t('sectionStack')}>
              <div className='flex flex-wrap gap-2'>
                {study.stack.map((tech) => (
                  <span
                    key={tech}
                    className='inline-block rounded-full border border-border bg-white px-3 py-1 text-sm font-medium text-warm-gray'
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CaseStudySection>

            <div className='flex flex-col gap-4 pt-4 sm:flex-row'>
              <a
                href={study.liveUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center rounded-lg bg-accent-dark px-6 py-3 font-medium text-white transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
              >
                {t('ctaLive')}
              </a>
              <Link
                href={`/${locale}#contact`}
                className='inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 font-medium text-charcoal transition-colors hover:border-accent hover:text-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
              >
                {t('ctaSimilar')}
              </Link>
            </div>
          </div>
        </div>

        <section className='border-t border-border bg-white px-4 py-16'>
          <div className='mx-auto max-w-5xl'>
            <h2 className='mb-8 font-serif text-2xl font-bold text-charcoal sm:text-3xl'>
              {t('otherWork')}
            </h2>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
              {others.map((cs) => (
                <Link
                  key={cs.slug}
                  href={`/${locale}/work/${cs.slug}`}
                  className='group block overflow-hidden rounded-xl border border-border bg-cream transition-all duration-300 hover:-translate-y-0.5 hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
                >
                  <div className='h-1.5' style={{ backgroundColor: cs.color }} />
                  <div className='p-6'>
                    <p className='mb-2 text-xs font-medium text-warm-gray'>{cs.category[locale]}</p>
                    <h3 className='font-serif text-lg font-bold text-charcoal transition-colors group-hover:text-accent-dark'>
                      {cs.client}
                    </h3>
                    <p className='mt-2 line-clamp-3 text-sm text-warm-gray'>{cs.brief[locale]}</p>
                    <span className='mt-4 inline-block text-sm font-medium text-accent-dark'>
                      {t('readCaseStudy')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
