import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// A sample QR table menu for a restaurant that does not exist. The 3D QR demo points here.
type Params = { locale: string };

const SECTIONS = {
  coffee: ['conLeche', 'cortadito', 'colao'],
  mains: ['mofongo', 'pernil', 'tostones', 'alcapurrias'],
  desserts: ['flan', 'tembleque'],
} as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'demo.menu' });
  return { title: t('metaTitle'), description: t('metaDescription'), robots: { index: false } };
}

export default async function SampleMenuPage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'demo.menu' });

  return (
    <main className='min-h-screen bg-cream text-charcoal'>
      <p role='note' className='bg-charcoal px-4 py-3 text-center text-sm text-white'>
        {t('banner')}
      </p>
      <div className='mx-auto max-w-md px-5 pb-16 pt-10'>
        <header className='text-center'>
          <h1 className='font-serif text-4xl font-bold'>{t('name')}</h1>
          <p className='mt-2 text-sm uppercase tracking-[0.14em] text-warm-gray'>{t('tagline')}</p>
        </header>

        {(Object.keys(SECTIONS) as (keyof typeof SECTIONS)[]).map((section) => (
          <section key={section} className='mt-10'>
            <h2 className='border-b border-border pb-2 font-serif text-2xl font-bold'>
              {t(`sections.${section}.title`)}
            </h2>
            <ul className='mt-4 space-y-5'>
              {SECTIONS[section].map((item) => (
                <li key={item}>
                  <div className='flex items-baseline gap-3'>
                    <span className='font-semibold'>
                      {t(`sections.${section}.items.${item}.name`)}
                    </span>
                    <span
                      aria-hidden='true'
                      className='flex-1 border-b border-dotted border-warm-gray/40'
                    />
                    <span className='font-semibold tabular-nums text-accent-dark'>
                      {t(`sections.${section}.items.${item}.price`)}
                    </span>
                  </div>
                  <p className='mt-1 text-sm leading-relaxed text-warm-gray'>
                    {t(`sections.${section}.items.${item}.description`)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className='mt-10 text-center text-xs text-warm-gray'>{t('note')}</p>
        <div className='mt-10 rounded-xl border border-border bg-white p-6 text-center'>
          <p className='font-medium'>{t('ctaHeading')}</p>
          <Link
            href={`/${locale}#contact`}
            className='mt-4 inline-flex min-h-12 items-center rounded-lg bg-accent-dark px-6 font-semibold text-white'
          >
            {t('ctaButton')}
          </Link>
        </div>
      </div>
    </main>
  );
}
