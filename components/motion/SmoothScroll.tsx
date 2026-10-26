'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

/**
 * Lenis smooth scroll (MIT, darkroom.engineering), driven by the GSAP ticker so
 * ScrollTrigger and Lenis share one clock. Off entirely when the visitor asks
 * for reduced motion, and on touch devices Lenis keeps native scrolling.
 * In-page anchor links scroll through Lenis, update the URL hash and move
 * keyboard focus to the target section, like a native jump would.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let lenis: Lenis | null = null;
    let cancelled = false;
    const tick = (time: number) => lenis?.raf(time * 1000);
    // Loaded after hydration so it stays out of the first-load bundle.
    import('lenis').then(({ default: LenisCtor }) => {
      if (cancelled) return;
      lenis = new LenisCtor({ duration: 1.05, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    });

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as HTMLElement | null)?.closest('a');
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target || !lenis) return;
      e.preventDefault();
      history.pushState(null, '', url.hash);
      lenis.scrollTo(target, {
        onComplete: () => {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        },
      });
    };
    // Capture phase so we run before Next's <Link> handler, which then sees
    // defaultPrevented and skips its own instant jump.
    document.addEventListener('click', onClick, true);

    return () => {
      cancelled = true;
      document.removeEventListener('click', onClick, true);
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return null;
}
