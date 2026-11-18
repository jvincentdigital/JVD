import { useTranslations } from 'next-intl';
import ScrollReveal from './ScrollReveal';

export default function About() {
  const t = useTranslations('about');

  return (
    <section id='about' className='bg-cream px-4 py-24 sm:py-32'>
      <div className='mx-auto max-w-3xl'>
        <ScrollReveal>
          <h2 className='mb-10 text-center font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
            {t('heading')}
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <div className='space-y-6 text-lg leading-relaxed text-warm-gray'>
            <p>{t('p1')}</p>
            <p>{t('p2')}</p>
            <p>{t('p3')}</p>
            <p>{t('p4')}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className='mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3'>
            {(['stat1', 'stat2', 'stat3'] as const).map((key) => (
              <div key={key} className='rounded-xl border border-border bg-white p-6 text-center'>
                <p className='font-serif font-bold text-charcoal'>{t(key)}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
