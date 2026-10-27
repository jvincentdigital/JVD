import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import ScrollReveal from './ScrollReveal';

const venueKeys = ['bar', 'barbershop', 'beauty', 'foodtruck', 'boutique'] as const;

export default function LocalBusiness() {
  const t = useTranslations('local');
  const locale = useLocale();

  return (
    <section id='local' className='bg-white px-4 py-24 sm:py-32'>
      <div className='mx-auto max-w-5xl'>
        <ScrollReveal>
          <div className='mb-16 text-center'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent-dark'>
              {t('label')}
            </p>
            <h2 className='mx-auto max-w-3xl font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
              {t('heading')}
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-warm-gray'>{t('subheading')}</p>
          </div>
        </ScrollReveal>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          {venueKeys.map((key) => (
            <ScrollReveal key={key}>
              <div className='card-lift h-full rounded-xl border border-border bg-cream p-8'>
                <span className='text-3xl' aria-hidden='true'>
                  {t(`venues.${key}.icon`)}
                </span>
                <h3 className='mt-3 font-serif text-xl font-bold text-charcoal'>
                  {t(`venues.${key}.name`)}
                </h3>
                <p className='mt-2 leading-relaxed text-warm-gray'>
                  {t(`venues.${key}.description`)}
                </p>
                {key === 'bar' && (
                  <Link
                    href={`/${locale}/demo/qr-menu`}
                    className='mt-4 inline-block font-semibold text-accent-dark underline-offset-4 hover:underline'
                  >
                    {t('demoLink')}
                  </Link>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className='mt-14 rounded-xl bg-accent-dark px-6 py-10 text-center text-white'>
            <p className='text-lg font-medium'>{t('cta')}</p>
            <a
              href='#contact'
              className='mt-5 inline-flex min-h-12 items-center rounded-lg bg-white px-7 font-semibold text-accent-dark shadow-sm transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-cream focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent-dark active:scale-[0.98]'
            >
              {t('ctaButton')}
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
