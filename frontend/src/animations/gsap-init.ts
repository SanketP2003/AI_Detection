/**
 * GSAP Plugin Registration & Shared Config
 * ─────────────────────────────────────────
 * Register ScrollTrigger once at app boot.
 * Export shared easing and duration constants used across all GSAP animations.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Motion tokens ──
export const EASE_ENTER = 'power4.out';           // cubic-bezier(0.16, 1, 0.3, 1)
export const EASE_EXIT  = 'power2.inOut';          // cubic-bezier(0.4, 0, 0.2, 1)
export const DUR_FAST   = 0.2;
export const DUR_NORMAL = 0.4;
export const DUR_SLOW   = 0.8;
export const STAGGER    = 0.08;

// ── Reduced motion helper ──
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger };
