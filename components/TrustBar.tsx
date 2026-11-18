import { useTranslations } from 'next-intl';

export default function TrustBar() {
  const t = useTranslations('trustBar');

  const items = [t('delivery'), t('accessibility'), t('bilingual'), t('industries'), t('local')];

  return (
    <section className='border-y border-border/80 bg-cream'>
      <ul className='mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-7'>
        {items.map((item, i) => (
          <li
            key={i}
            className='flex items-center gap-2 text-sm font-medium tracking-[0.01em] text-warm-gray'
          >
            <span aria-hidden='true' className='h-1.5 w-1.5 rounded-full bg-accent' />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
