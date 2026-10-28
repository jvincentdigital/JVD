'use client';

// Every 3D-to-QR style we have made, by category: objects that burst into a code (3D engine),
// a hangtag that flips to one (plain CSS) and the flower bouquets page in a frame.
// LAB: client pieces (Rad, Fluffcore) are shown for John's review only; drop them
// (client !== '') before this page goes public.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import BurstQR from '@/lib/burst-qr/BurstQR';
import { encodeQR } from '@/lib/burst-qr/qr.js';
import { cafe, cafePalette } from '@/lib/burst-qr/objects/cafe.js';
import { mofongo, mofongoPalette } from '@/lib/burst-qr/objects/mofongo.js';
import { mic, micPalette } from '@/lib/burst-qr/objects/mic.js';
import { rad, radPalette } from '@/lib/burst-qr/objects/rad.js';
import {
  barber,
  barberPalette,
  salon,
  salonPalette,
  bakery,
  bakeryPalette,
} from '@/lib/burst-qr/objects/biz.js';
import { loadModels } from '@/lib/burst-qr/objects/glb.js';
import type { BurstObjectBuilder } from '@/lib/burst-qr/burst-qr';
import { phone, phonePalette, arcade, arcadePalette } from '@/lib/burst-qr/objects/creative.js';

// client: pieces made for a client (their brand); test page only, strip them before the page goes public.
const OBJECTS = {
  mofongo: { object: mofongo, palette: mofongoPalette, menu: true, client: '' },
  cafe: { object: cafe, palette: cafePalette, menu: true, client: '' },
  mic: { object: mic, palette: micPalette, menu: false, client: '' },
  bakery: { object: bakery, palette: bakeryPalette, menu: true, client: '' },
  barber: { object: barber, palette: barberPalette, menu: false, client: '' },
  salon: { object: salon, palette: salonPalette, menu: false, client: '' },
  phone: { object: phone, palette: phonePalette, menu: false, client: '' },
  arcade: { object: arcade, palette: arcadePalette, menu: false, client: '' },
  rad: { object: rad, palette: radPalette, menu: false, client: 'Fluffcore' },
} as const;

// Ready-made CC0 models (Grab3D, grab3d.com/license, saved 2026-10-27), loaded before the engine starts.
const MODELS = {
  gloves: {
    items: [{ url: '/lab/models/boxing-gloves.glb', height: 1 }],
    colors: ['#e8766a', '#f4a08f', '#ffffff'],
    palette: { dark: '#1a0d0d', bg: '#f3efec', wash: '#c0392b' },
  },
  car: {
    items: [{ url: '/lab/models/sedan.glb', height: 1 }],
    colors: ['#a9cfe8', '#ffffff', '#2b2f36'],
    palette: { dark: '#11161c', bg: '#eef0f2', wash: '#5b7a99' },
  },
  house: {
    items: [
      { url: '/lab/models/modern-house.glb', height: 1.6 },
      { url: '/lab/models/palm-tree.glb', height: 2.2, x: 1.9, z: 0.6 },
    ],
    colors: ['#e9c79a', '#bcd9ea', '#9fd18b', '#ffffff'],
    palette: { dark: '#14211a', bg: '#f0f3ec', wash: '#7fae6e' },
  },
} as const;
type Model = keyof typeof MODELS;
type Obj = keyof typeof OBJECTS | Model;
const isModel = (k: Obj): k is Model => k in MODELS;

// Each category: objects that burst, cards that flip, or a whole demo page shown in a frame.
const CATEGORIES = [
  { key: 'food', burst: ['mofongo', 'cafe', 'bakery'] },
  { key: 'flowers', frame: { src: '/lab/bloom-3d.html', client: '' } },
  { key: 'fashion', burst: ['rad'], flip: ['tag'] },
  { key: 'media', burst: ['mic'] },
  { key: 'beauty', burst: ['barber', 'salon'] },
  { key: 'fitness', burst: ['gloves'] },
  { key: 'auto', burst: ['car'] },
  { key: 'realestate', burst: ['house'] },
  { key: 'gaming', burst: ['arcade'] },
  { key: 'social', burst: ['phone'] },
] as const satisfies readonly {
  key: string;
  burst?: readonly Obj[];
  flip?: readonly 'tag'[];
  frame?: { src: string; client: string };
}[];
type Cat = (typeof CATEGORIES)[number];

// A path on this same site, so codes work on localhost, previews and production. A Vercel
// share key after # (#share=KEY) goes into the code too; it never reaches the server or git.
function useSiteLink(path: string) {
  const [link, setLink] = useState('');
  useEffect(() => {
    const share = new URLSearchParams(window.location.hash.slice(1)).get('share');
    setLink(
      `${window.location.origin}${path}${share ? `?_vercel_share=${encodeURIComponent(share)}` : ''}`,
    );
  }, [path]);
  return link;
}

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

function QrSvg({ link }: { link: string }) {
  const { size, modules } = encodeQR(link, { ecl: 'M' });
  const n = size + 8;
  let d = '';
  modules.forEach((row: boolean[], y: number) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    }),
  );
  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering='crispEdges'
      aria-hidden='true'
      className='h-auto w-full'
    >
      <rect width={n} height={n} fill='#fff' />
      <path d={d} fill='#1f1f1f' />
    </svg>
  );
}

// A hangtag that flips to a QR code on the first tap and opens the link on the second.
function FlipCard({
  link,
  label,
  back,
  children,
}: {
  link: string;
  label: [string, string];
  back: string;
  children: React.ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);
  const size = 'h-[300px] w-[200px]';
  const cut = {
    clipPath: 'polygon(26px 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%, 0 26px)',
  };
  const face =
    'absolute inset-0 grid content-center justify-items-center gap-3 p-5 [backface-visibility:hidden]';
  return (
    <button
      type='button'
      aria-label={flipped ? label[1] : label[0]}
      onClick={() => (flipped ? window.location.assign(link) : setFlipped(true))}
      onKeyDown={(e) => e.key === 'Escape' && setFlipped(false)}
      className='rounded-3xl [perspective:900px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark focus-visible:ring-offset-4'
    >
      <span
        className={`relative block ${size} transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <span className={`${face} bg-accent-dark text-white`} style={cut}>
          {children}
        </span>
        <span
          className={`${face} bg-white text-charcoal ring-1 ring-border [transform:rotateY(180deg)]`}
          style={cut}
        >
          {link && <QrSvg link={link} />}
          <span className='text-xs font-medium text-warm-gray'>{back}</span>
        </span>
      </span>
    </button>
  );
}

export default function QrGallery() {
  const t = useTranslations('demo.qrGallery');
  const locale = useLocale();
  const [cat, setCat] = useState<Cat>(CATEGORIES[0]);
  const [obj, setObj] = useState<Obj>('mofongo');
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const menuLink = useSiteLink(`/${locale}/demo/menu`);
  const homeLink = useSiteLink(`/${locale}`);
  const link = !isModel(obj) && OBJECTS[obj].menu ? menuLink : homeLink;
  // models load first (async); the engine gets the builder once it is ready
  const [loaded, setLoaded] = useState<{ key: Model; build: BurstObjectBuilder } | null>(null);
  useEffect(() => {
    if (!isModel(obj)) return;
    let alive = true;
    loadModels(MODELS[obj].items, { colors: [...MODELS[obj].colors] })
      .then((build: BurstObjectBuilder) => alive && setLoaded({ key: obj, build }))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [obj]);
  const object = isModel(obj) ? (loaded?.key === obj ? loaded.build : null) : OBJECTS[obj].object;
  const palette = isModel(obj) ? MODELS[obj].palette : OBJECTS[obj].palette;
  const client = isModel(obj) ? '' : OBJECTS[obj].client;
  const burst: readonly Obj[] = 'burst' in cat ? cat.burst : [];
  const flip: readonly 'tag'[] = 'flip' in cat ? cat.flip : [];
  const frame = 'frame' in cat ? cat.frame : null;

  const pickCat = (c: Cat) => {
    setCat(c);
    setOpen(false);
    if ('burst' in c) setObj(c.burst[0]);
  };

  return (
    <div className='space-y-10'>
      <div
        role='group'
        aria-label={t('categoryLabel')}
        className='flex flex-wrap justify-center gap-2'
      >
        {CATEGORIES.map((c) => (
          <Chip key={c.key} on={cat.key === c.key} onClick={() => pickCat(c)}>
            {t(`categories.${c.key}`)}
          </Chip>
        ))}
      </div>

      {burst.length > 0 && (
        <section aria-label={t(`categories.${cat.key}`)}>
          {burst.length > 1 && (
            <div className='mb-4 flex flex-wrap gap-2'>
              {burst.map((k) => (
                <Chip key={k} on={obj === k} onClick={() => setObj(k)}>
                  {t(`objects.${k}.name`)}
                </Chip>
              ))}
            </div>
          )}
          <div className='relative h-[24rem] overflow-hidden rounded-2xl border border-border bg-cream sm:h-[60vh] sm:max-h-[560px] sm:min-h-[360px]'>
            {link && object && !failed && (
              // key: a new object needs a fresh engine (its link and palette change too)
              <BurstQR
                key={obj}
                className='absolute inset-0'
                link={link}
                object={object}
                palette={palette}
                label={t('canvasLabel')}
                onToggle={setOpen}
                onError={() => setFailed(true)}
              />
            )}
            {failed && (
              <p className='grid h-full place-items-center p-8 text-center text-warm-gray'>
                {t('error')}
              </p>
            )}
            <p className='pointer-events-none absolute bottom-4 left-0 right-0 text-center font-serif text-sm italic text-warm-gray'>
              {open ? t('tapBack') : t('tapHint')}
            </p>
          </div>
          <p className='mt-3 text-sm text-warm-gray'>
            <span className='font-semibold text-charcoal'>{t('goodFor')}</span>{' '}
            {t(`objects.${obj}.for`)}
            {client && (
              <span className='ml-2 rounded-full bg-charcoal px-2 py-0.5 text-xs font-semibold text-white'>
                {t('clientWork', { client })}
              </span>
            )}
            {!isModel(obj) && OBJECTS[obj].menu && (
              <>
                {' '}
                <Link
                  href={`/${locale}/demo/qr-menu`}
                  className='font-semibold text-accent-dark underline-offset-4 hover:underline'
                >
                  {t('menuDemo')}
                </Link>
              </>
            )}
          </p>
        </section>
      )}

      {frame && (
        <section aria-label={t(`frames.${cat.key}`)}>
          <p className='mb-3 text-sm text-warm-gray'>
            {t(`frames.${cat.key}`)}
            {frame.client && (
              <span className='ml-2 rounded-full bg-charcoal px-2 py-0.5 text-xs font-semibold text-white'>
                {t('clientWork', { client: frame.client })}
              </span>
            )}
          </p>
          {homeLink && (
            <iframe
              title={t(`frames.${cat.key}`)}
              src={`${frame.src}?link=${encodeURIComponent(homeLink)}`}
              className='h-[44rem] w-full rounded-2xl border border-border bg-white'
              loading='lazy'
            />
          )}
        </section>
      )}

      {flip.length > 0 && (
        <section aria-label={t('flipTitle')}>
          <p className='mb-3 text-sm text-warm-gray'>{t('flipBody')}</p>
          <div className='flex flex-wrap justify-center gap-x-24 gap-y-10 rounded-2xl border border-border bg-cream px-4 py-10'>
            {flip.includes('tag') && (
              <figure className='grid justify-items-center gap-4'>
                <FlipCard
                  link={homeLink}
                  label={[t('tag.label'), t('tag.labelBack')]}
                  back={t('scanBack')}
                >
                  <span
                    aria-hidden='true'
                    className='absolute top-3 h-3.5 w-3.5 rounded-full bg-cream ring-2 ring-white/70'
                  />
                  <span className='font-serif text-3xl font-bold'>{t('tag.brand')}</span>
                  <span className='text-sm text-white/85'>{t('tag.line')}</span>
                </FlipCard>
                <figcaption className='max-w-[16rem] text-center text-sm text-warm-gray'>
                  {t('tag.for')}
                </figcaption>
              </figure>
            )}
          </div>
        </section>
      )}

      <p className='text-center text-sm text-warm-gray'>{t('scanTip')}</p>
    </div>
  );
}
