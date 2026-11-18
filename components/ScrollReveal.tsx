'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from './motion/gsap';

/**
 * Scroll-triggered reveal, now on GSAP ScrollTrigger. Content is server-rendered
 * fully visible: it is only hidden once JS runs, and only if it is still below
 * the fold, so no-JS visitors, crawlers and reduced-motion users always see it.
 * `stagger` reveals direct children one after another (card grids).
 */
export default function ScrollReveal({
  children,
  className = '',
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const targets = stagger ? Array.from(el.children) : [el];
      gsap.from(targets, {
        autoAlpha: 0,
        y: 28,
        duration: 0.8,
        ease: 'power3.out',
        stagger: stagger ? 0.08 : 0,
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
