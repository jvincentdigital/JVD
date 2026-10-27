'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import BurstQR from '@/lib/burst-qr/BurstQR';
import type { BurstQR as BurstApi, BurstStyle } from '@/lib/burst-qr/burst-qr';
import { cafe, cafePalette } from '@/lib/burst-qr/objects/cafe.js';
import { mofongo, mofongoPalette } from '@/lib/burst-qr/objects/mofongo.js';

const DISHES = {
  mofongo: { object: mofongo, palette: mofongoPalette },
  cafe: { object: cafe, palette: cafePalette },
} as const;
type Dish = keyof typeof DISHES;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type='button'
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark focus-visible:ring-offset-2 ${
        on
          ? 'border-charcoal bg-charcoal text-white'
          : 'border-border bg-white text-charcoal hover:border-charcoal'
      }`}
    >
      {children}
    </button>
  );
}

export default function QrMenuDemo() {
  const t = useTranslations('demo.qrMenu');
  const locale = useLocale();
  const [link, setLink] = useState('');
  const [dish, setDish] = useState<Dish>('mofongo');
  const [style, setStyle] = useState<BurstStyle>('realistic');
  const [api, setApi] = useState<BurstApi | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const menuPath = `/${locale}/demo/menu`;

  // The code points at this same site, so it works on localhost, previews and production.
  // A Vercel share key in the address after # (#share=KEY) goes into the code too, so a
  // phone can open a login-protected preview. The key never reaches the server or git.
  useEffect(() => {
    const share = new URLSearchParams(window.location.hash.slice(1)).get('share');
    setLink(
      `${window.location.origin}${menuPath}${share ? `?_vercel_share=${encodeURIComponent(share)}` : ''}`,
    );
  }, [menuPath]);

  const download = () => {
    if (!api) return;
    const a = document.createElement('a');
    a.href = api.toPNG();
    a.download = `jvd-qr-menu-${dish}.png`;
    a.click();
  };

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_300px]'>
      <div className='relative h-[24rem] overflow-hidden rounded-2xl border border-border bg-cream sm:h-[60vh] sm:max-h-[600px] sm:min-h-[360px] lg:h-auto lg:max-h-none lg:min-h-[500px]'>
        {link && !failed && (
          <BurstQR
            className='absolute inset-0'
            link={link}
            object={DISHES[dish].object}
            palette={DISHES[dish].palette}
            style={style}
            label={t('canvasLabel')}
            onReady={setApi}
            onToggle={setOpen}
            onError={() => setFailed(true)}
          />
        )}
        {!api && !failed && (
          <p className='pointer-events-none absolute inset-0 grid place-items-center text-sm text-warm-gray'>
            {t('loading')}
          </p>
        )}
        {failed && (
          <div className='grid h-full place-items-center p-8 text-center'>
            <p className='max-w-sm text-warm-gray'>
              {t('error')}{' '}
              <Link href={menuPath} className='font-semibold text-accent-dark underline'>
                {t('openMenu')}
              </Link>
            </p>
          </div>
        )}
        {api && (
          <button
            type='button'
            onClick={() => api.toggle()}
            className='absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-4 py-2 font-serif text-sm italic text-warm-gray shadow-sm backdrop-blur transition-colors hover:text-charcoal'
          >
            {open ? t('tapBack') : t('tapHint')}
          </button>
        )}
      </div>

      <aside className='grid content-start gap-6 rounded-2xl border border-border bg-white p-6'>
        <div>
          <p className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-warm-gray'>
            {t('objectLabel')}
          </p>
          <div className='flex flex-wrap gap-2'>
            {(Object.keys(DISHES) as Dish[]).map((d) => (
              <Chip key={d} on={dish === d} onClick={() => setDish(d)}>
                {t(d)}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-warm-gray'>
            {t('styleLabel')}
          </p>
          <div className='flex flex-wrap gap-2'>
            {(['realistic', 'watercolor'] as const).map((s) => (
              <Chip key={s} on={style === s} onClick={() => setStyle(s)}>
                {t(s)}
              </Chip>
            ))}
          </div>
        </div>
        <button
          type='button'
          onClick={download}
          disabled={!api}
          className='min-h-12 rounded-lg bg-accent-dark px-6 font-semibold text-white shadow-sm transition-[transform,background-color] duration-200 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50'
        >
          {t('download')}
        </button>
        <div className='space-y-3 text-sm leading-relaxed text-warm-gray'>
          <p>{t('scanTip')}</p>
          <p>{t('printTip')}</p>
          <Link href={menuPath} className='inline-block font-semibold text-accent-dark underline'>
            {t('openMenu')}
          </Link>
        </div>
      </aside>
    </div>
  );
}
