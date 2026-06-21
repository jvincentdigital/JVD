'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Nav as UiNav, type NavLinkComponent } from '@jvd/ui/sections';

const sectionIds = [
  'services',
  'work',
  'local',
  'pricing',
  'accessibility',
  'about',
  'contact',
] as const;

const labelKeyById: Record<(typeof sectionIds)[number], string> = {
  services: 'services',
  work: 'work',
  local: 'local',
  pricing: 'packages',
  accessibility: 'accessibility',
  about: 'about',
  contact: 'contact',
};

const NextLink: NavLinkComponent = ({ href, className, children, onClick }) => (
  <Link href={href} className={className} onClick={onClick}>
    {children}
  </Link>
);

export default function Nav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const otherLocale = locale === 'en' ? 'es' : 'en';
  const otherPath = pathname.replace(/^\/(en|es)/, `/${otherLocale}`) || `/${otherLocale}`;
  const hrefFor = (id: string) => (isHome ? `#${id}` : `/${locale}#${id}`);

  return (
    <UiNav
      brand='John Vincent Digital'
      brandHref={`/${locale}`}
      sections={sectionIds.map((id) => ({
        id,
        label: t(labelKeyById[id]),
        href: hrefFor(id),
      }))}
      localeSwitcher={{
        label: locale === 'en' ? 'ES' : 'EN',
        href: otherPath,
      }}
      activeSectionId={isHome ? undefined : null}
      LinkComponent={NextLink}
    />
  );
}
