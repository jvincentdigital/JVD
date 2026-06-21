import { useTranslations } from 'next-intl';
import { Footer as UiFooter } from '@jvd/ui/sections';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <UiFooter
      tone='dark'
      tagline={<span>{t('location')}</span>}
      socialLinks={[
        {
          label: 'GitHub',
          href: 'https://github.com/jvincentdigital',
          external: true,
        },
      ]}
      copyright={t('copyright')}
    />
  );
}
