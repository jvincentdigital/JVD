import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className='flex min-h-screen items-center justify-center bg-cream px-4'>
      <div className='text-center'>
        <p className='font-serif text-6xl font-bold text-accent-dark'>404</p>
        <h1 className='mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl'>
          {t('heading')}
        </h1>
        <p className='mt-3 text-lg text-warm-gray'>{t('description')}</p>
        <a
          href='/'
          className='mt-8 inline-block rounded-lg bg-accent-dark px-8 py-3 font-medium text-white transition-colors hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
        >
          {t('backHome')}
        </a>
      </div>
    </div>
  );
}
