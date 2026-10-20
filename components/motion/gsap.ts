'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// GSAP 3.13+ ships every plugin under the free "standard no charge" license,
// commercial use included: https://gsap.com/standard-license
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
