import { useTranslations, useLocale } from 'next-intl';
import ScrollReveal from './ScrollReveal';
import PricingTierCard from './PricingTierCard';

const tierKeys = ['tier1', 'tier2', 'tier3'] as const;

export default function AccessibilitySection() {
  const t = useTranslations('accessibility');
  const locale = useLocale();
  const ctaHref = `/${locale}?service=accessibility#contact`;

  return (
    <section id='accessibility' className='border-t border-border bg-white px-4 py-24 sm:py-32'>
      <div className='mx-auto max-w-6xl'>
        <ScrollReveal>
          <div className='mb-10 text-center'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent-dark'>
              {t('label')}
            </p>
            <h2 className='mx-auto max-w-3xl font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
              {t('heading')}
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-warm-gray'>
              {t('subheading')}
            </p>
            <p className='mx-auto mt-4 max-w-2xl leading-relaxed text-warm-gray'>{t('intro')}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <p className='mx-auto mb-12 max-w-3xl text-center text-sm italic text-warm-gray'>
            {t('trustSignal')}
          </p>
        </ScrollReveal>

        <div className='grid grid-cols-1 items-stretch gap-6 md:grid-cols-3'>
          {tierKeys.map((key, i) => (
            <ScrollReveal key={key}>
              <PricingTierCard
                name={t(`${key}.name`)}
                tagline={t(`${key}.tagline`)}
                features={t.raw(`${key}.features`) as string[]}
                ctaLabel={t(`${key}.cta`)}
                ctaHref={ctaHref}
                featured={i === 1}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className='mt-14 rounded-xl border border-border bg-cream px-6 py-10 text-center'>
            <p className='font-serif text-xl font-bold text-charcoal sm:text-2xl'>
              {t('bottomCtaHeading')}
            </p>
            <p className='mt-2 text-warm-gray'>{t('bottomCtaSubheading')}</p>
            <a href={ctaHref} className='btn-primary mt-6'>
              {t('bottomCtaButton')}
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
