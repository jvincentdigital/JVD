import { useTranslations } from 'next-intl';
import ScrollReveal from './ScrollReveal';

const bundleKeys = ['localPresence', 'launch', 'shopify', 'identity', 'retainer'] as const;

export default function Pricing() {
  const t = useTranslations('pricing');

  return (
    <section id='pricing' className='bg-cream px-4 py-24 sm:py-32'>
      <div className='mx-auto max-w-6xl'>
        <ScrollReveal>
          <div className='mb-16 text-center'>
            <h2 className='font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
              {t('heading')}
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-warm-gray'>{t('subheading')}</p>
          </div>
        </ScrollReveal>

        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2'>
          {bundleKeys.map((key) => {
            const covered = t.raw(`bundles.${key}.covered`) as string[];

            return (
              <ScrollReveal key={key}>
                <div className='card-lift relative h-full rounded-xl border border-border bg-white p-8'>
                  {key === 'localPresence' && (
                    <span className='absolute right-4 top-4 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-dark'>
                      {t(`bundles.${key}.badge`)}
                    </span>
                  )}
                  <h3 className='font-serif text-xl font-bold text-charcoal'>
                    {t(`bundles.${key}.name`)}
                  </h3>
                  <p className='mt-4 leading-relaxed text-warm-gray'>
                    {t(`bundles.${key}.outcome`)}
                  </p>
                  <div className='mt-6 border-t border-border pt-6'>
                    <p className='mb-4 text-xs font-medium uppercase tracking-[0.08em] text-accent-dark'>
                      {t('coveredLabel')}
                    </p>
                    <ul className='space-y-3'>
                      {covered.map((item, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm text-warm-gray'>
                          <svg
                            className='mt-0.5 h-4 w-4 flex-shrink-0 text-accent'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal>
          <div className='mt-14 rounded-xl bg-accent-dark px-6 py-10 text-center text-white'>
            <p className='text-lg font-medium'>{t('ctaQuestion')}</p>
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
