import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import QrGallery from '@/components/QrGallery';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'demo.qrGallery' });
  return { title: t('metaTitle'), description: t('metaDescription'), robots: { index: false } };
}

export default async function QrGalleryPage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'demo.qrGallery' });

  return (
    <>
      <Nav />
      <main id='main-content' className='bg-cream px-4 pb-24 pt-28 sm:pt-32'>
        <div className='mx-auto max-w-5xl'>
          <Link
            href={`/${locale}#local`}
            className='text-sm font-medium text-warm-gray hover:text-charcoal'
          >
            {t('back')}
          </Link>
          <div className='mb-10 mt-6 text-center'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent-dark'>
              {t('label')}
            </p>
            <h1 className='mx-auto max-w-3xl font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
              {t('heading')}
            </h1>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-warm-gray'>{t('subheading')}</p>
          </div>

          <QrGallery />

          <div className='mt-14 rounded-xl bg-accent-dark px-6 py-10 text-center text-white'>
            <p className='text-lg font-medium'>{t('ctaHeading')}</p>
            <Link
              href={`/${locale}#contact`}
              className='mt-5 inline-flex min-h-12 items-center rounded-lg bg-white px-7 font-semibold text-accent-dark shadow-sm transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-cream focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent-dark active:scale-[0.98]'
            >
              {t('ctaButton')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
