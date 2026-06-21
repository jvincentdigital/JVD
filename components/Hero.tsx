import { useTranslations } from 'next-intl';
import { Hero as UiHero } from '@jvd/ui/sections';

function UnderlineAccent() {
  return (
    <svg
      className='h-3 w-48'
      viewBox='0 0 200 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M1 9C40 3 80 1 100 5C120 9 160 3 199 7'
        stroke='#00A86B'
        strokeWidth='2.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <UiHero
      variant='brand'
      title={t('headline')}
      subtitle={t('subhead')}
      decoration={<UnderlineAccent />}
      cta={{ label: t('cta_primary'), href: '#services' }}
      secondaryCta={{ label: t('cta_secondary'), href: '#work' }}
    />
  );
}
