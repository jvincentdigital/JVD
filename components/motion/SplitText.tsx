'use client';

/*
 * Adapted from React Bits "SplitText" (ts-tailwind variant)
 * https://github.com/DavidHDev/react-bits
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * free to use, including commercially, as part of an application, website or
 * product; the component itself may not be sold, sublicensed or redistributed
 * on its own. The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * JVD changes: trimmed to the one effect we use (masked word rise on load),
 * no hover/loop springs, text stays readable before hydration and for screen
 * readers (GSAP SplitText aria: 'auto'), and a CSS failsafe reveals it if JS
 * never runs.
 */

import { useRef, type ElementType } from 'react';
import { gsap, SplitText as GSAPSplitText, useGSAP, prefersReducedMotion } from './gsap';

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** seconds between words */
  stagger?: number;
  delay?: number;
  duration?: number;
  onComplete?: () => void;
};

export default function SplitText({
  text,
  as: Tag = 'p',
  className = '',
  stagger = 0.06,
  delay = 0.1,
  duration = 0.9,
  onComplete,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const done = () => {
        el.dataset.motion = 'ready';
        onComplete?.();
      };
      if (prefersReducedMotion()) {
        done();
        return;
      }

      let split: GSAPSplitText | null = null;
      let cancelled = false;
      const run = () => {
        if (cancelled) return;
        split = new GSAPSplitText(el, {
          type: 'words',
          mask: 'words',
          wordsClass: 'split-word',
          aria: 'auto',
        });
        gsap.set(split.words, { yPercent: 110 });
        el.dataset.motion = 'ready';
        gsap.to(split.words, {
          yPercent: 0,
          duration,
          delay,
          ease: 'expo.out',
          stagger,
          onComplete: () => {
            // Hand back plain text: no masks left to clip descenders or confuse screen readers.
            split?.revert();
            split = null;
            onComplete?.();
          },
        });
      };
      // Split only after the web font is in, or line breaks shift mid-animation.
      if (document.fonts?.status === 'loaded') run();
      else document.fonts.ready.then(run);

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <Tag ref={ref} className={className} data-motion='pending'>
      {text}
    </Tag>
  );
}
