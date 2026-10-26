import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import ScrollReveal from './ScrollReveal';

const projects = [
  { key: 'imperfect', slug: 'imperfect-gaming', color: '#C8E400' },
  { key: 'emmalina', slug: 'emmalina', color: '#C9A96E' },
  { key: 'magenta', slug: 'magenta-the-label', color: '#C4587A' },
  { key: 'profumo', slug: 'profumo-di-vita', color: '#8B6F47' },
];

export default function Work() {
  const t = useTranslations('work');
  const tCase = useTranslations('caseStudy');
  const locale = useLocale();

  return (
    <section id='work' className='bg-cream px-4 py-24 sm:py-32'>
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
          {projects.map((project) => (
            <ScrollReveal key={project.key}>
              <div className='card-lift overflow-hidden rounded-xl border border-border bg-white'>
                <div className='h-1.5' style={{ backgroundColor: project.color }} />
                <div className='p-8'>
                  <span className='mb-3 inline-block rounded-full border border-border px-2.5 py-1 text-xs font-medium text-warm-gray'>
                    {t(`projects.${project.key}.industry`)}
                  </span>
                  <h3 className='font-serif text-xl font-bold text-charcoal'>
                    {t(`projects.${project.key}.name`)}
                  </h3>
                  <p className='mt-2 text-warm-gray'>{t(`projects.${project.key}.description`)}</p>
                  <div className='mt-4 border-t border-border pt-4'>
                    <p className='mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-accent-dark'>
                      {t(`projects.${project.key}.challengeLabel`)}
                    </p>
                    <p className='text-sm leading-relaxed text-warm-gray'>
                      {t(`projects.${project.key}.challenge`)}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/work/${project.slug}`}
                    className='mt-4 inline-flex min-h-11 items-center rounded font-semibold text-accent-dark transition-colors hover:text-charcoal focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
                  >
                    {tCase('readCaseStudy')}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
