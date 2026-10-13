import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import ScrollReveal from './ScrollReveal';

const projects = [
  { key: 'imperfect', slug: 'imperfect-gaming', color: '#C8E400' },
  { key: 'emmalina', slug: 'emmalina', color: '#C9A96E' },
  { key: 'xpress', slug: 'xpress-color', color: '#FFD400' },
];

export default function Work() {
  const t = useTranslations('work');
  const tCase = useTranslations('caseStudy');
  const locale = useLocale();

  return (
    <section id='work' className='bg-cream px-4 py-20'>
      <div className='mx-auto max-w-5xl'>
        <ScrollReveal>
          <div className='mb-14 text-center'>
            <h2 className='font-serif text-3xl font-bold text-charcoal sm:text-4xl'>
              {t('heading')}
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-warm-gray'>{t('subheading')}</p>
          </div>
        </ScrollReveal>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          {projects.map((project, i) => (
            // With an odd number of projects the last card takes the full row.
            <ScrollReveal
              key={project.key}
              className={
                i === projects.length - 1 && projects.length % 2 === 1 ? 'sm:col-span-2' : undefined
              }
            >
              <div className='overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-accent'>
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
                    <p className='mb-1.5 text-xs font-medium uppercase tracking-wide text-accent/70'>
                      {t(`projects.${project.key}.challengeLabel`)}
                    </p>
                    <p className='text-sm leading-relaxed text-warm-gray'>
                      {t(`projects.${project.key}.challenge`)}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/work/${project.slug}`}
                    className='mt-4 inline-block rounded font-medium text-accent transition-colors hover:text-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
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
