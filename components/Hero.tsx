'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import SplitText from './motion/SplitText';
import { gsap, useGSAP, prefersReducedMotion } from './motion/gsap';

/*
 * LAB: local hero instead of @jvd/ui <Hero> so the signature moment can be
 * choreographed: headline words rise out of a mask, the green underline draws
 * itself, then the subhead and buttons settle in. Same copy, same links.
 */
export default function Hero() {
  const t = useTranslations('hero');
  const scope = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const path = scope.current?.querySelector<SVGPathElement>('[data-underline]');
      const after = scope.current?.querySelectorAll('[data-hero-after]');
      if (!path || !after) return;
      if (prefersReducedMotion()) {
        after.forEach((n) => ((n as HTMLElement).dataset.motion = 'ready'));
        return;
      }
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(after, { autoAlpha: 0, y: 16 });
      after.forEach((n) => ((n as HTMLElement).dataset.motion = 'ready'));
      tl.current = gsap
        .timeline({ paused: true })
        .to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' })
        .to(
          after,
          { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 },
          '-=0.55',
        );
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className='relative w-full overflow-hidden bg-cream px-4 pb-24 pt-20 sm:pb-32 sm:pt-32'
    >
      {/* soft light from above: depth without a border or a stock image */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-4xl bg-[radial-gradient(closest-side,rgba(0,168,107,0.07),rgba(0,168,107,0.03)_55%,transparent)]'
      />
      <div className='relative mx-auto max-w-4xl text-center'>
        <SplitText
          as='h1'
          text={t('headline')}
          className='font-serif text-[2.75rem] font-bold leading-[1.04] tracking-[-0.025em] text-charcoal sm:text-6xl lg:text-7xl'
          onComplete={() => tl.current?.play()}
          delay={0.15}
        />
        <div className='mt-5 flex justify-center' aria-hidden='true'>
          <svg className='h-3 w-48 sm:w-56' viewBox='0 0 200 12' fill='none'>
            <path
              data-underline
              d='M1 9C40 3 80 1 100 5C120 9 160 3 199 7'
              stroke='#00A86B'
              strokeWidth='2.5'
              strokeLinecap='round'
            />
          </svg>
        </div>
        <p
          data-hero-after
          data-motion='pending'
          className='mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl'
        >
          {t('subhead')}
        </p>
        <div
          data-hero-after
          data-motion='pending'
          className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6'
        >
          <a href='#services' className='btn-primary group'>
            {t('cta_primary')}
            <span aria-hidden='true' className='btn-arrow'>
              &rarr;
            </span>
          </a>
          <a href='#work' className='link-quiet'>
            {t('cta_secondary')}
          </a>
        </div>
      </div>
    </section>
  );
}
