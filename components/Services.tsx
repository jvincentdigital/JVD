import { useTranslations } from 'next-intl';
import ScrollReveal from './ScrollReveal';

const icons = [
  <svg
    key='web'
    className='h-8 w-8 text-accent'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    />
  </svg>,
  <svg
    key='shop'
    className='h-8 w-8 text-accent'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z'
    />
  </svg>,
  <svg
    key='brand'
    className='h-8 w-8 text-accent'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
    />
  </svg>,
  <svg
    key='retainer'
    className='h-8 w-8 text-accent'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    />
  </svg>,
];

export default function Services() {
  const t = useTranslations('services');

  const cards = [1, 2, 3, 4].map((i) => ({
    icon: icons[i - 1],
    title: t(`card${i}.title`),
    description: t(`card${i}.description`),
    link: t(`card${i}.link`),
  }));

  return (
    <section id='services' className='bg-cream px-4 py-24 sm:py-32'>
      <div className='mx-auto max-w-5xl'>
        <ScrollReveal>
          <div className='mb-16 text-center'>
            <h2 className='font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
              {t('heading')}
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-warm-gray'>{t('subheading')}</p>
          </div>
        </ScrollReveal>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          {cards.map((card, i) => (
            <ScrollReveal key={i}>
              <div className='card-lift h-full rounded-xl border border-border bg-white p-8'>
                <div className='mb-4'>{card.icon}</div>
                <h3 className='font-serif text-xl font-bold text-charcoal'>{card.title}</h3>
                <p className='mt-3 leading-relaxed text-warm-gray'>{card.description}</p>
                <a
                  href='#pricing'
                  className='mt-4 inline-flex min-h-11 items-center rounded font-semibold text-accent-dark transition-colors hover:text-charcoal focus:outline-none focus:ring-2 focus:ring-accent'
                >
                  {card.link}
                </a>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
