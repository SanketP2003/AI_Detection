/**
 * HeroTimeline — GSAP-driven hero intro animation
 * ─────────────────────────────────────────────────
 * Orchestrates the staggered reveal of hero text, badge, buttons, disclaimer,
 * and the demo card.  Runs once on mount.  Respects prefers-reduced-motion.
 */
import { useRef, useEffect } from 'react';
import { gsap, EASE_ENTER, DUR_SLOW, prefersReducedMotion } from './gsap-init';

export function useHeroTimeline() {
  const heroRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE_ENTER } });

      // 1. Badge Pill
      tl.from('.hero-copy .hero-pill-badge, .hero-copy .badge', {
        y: 20,
        opacity: 0,
        duration: 0.5,
      });

      // 2. Heading
      tl.from('.hero-copy h1', {
        y: 50,
        opacity: 0,
        duration: DUR_SLOW,
      }, '-=0.3');

      // 3. Body text
      tl.from('.hero-copy > p', {
        y: 25,
        opacity: 0,
        duration: 0.5,
      }, '-=0.5');

      // 4. CTA buttons
      tl.from('.hero-copy .hero-cta-group, .hero-copy .button-row', {
        y: 20,
        opacity: 0,
        duration: 0.4,
      }, '-=0.3');

      // 5. Trust bar
      tl.from('.hero-trust-bar, .hero-disclaimer', {
        y: 15,
        opacity: 0,
        duration: 0.4,
      }, '-=0.2');

      // 6. Interactive Manuscript Centerpiece — smooth minimalist reveal
      if (demoRef.current) {
        tl.from(demoRef.current, {
          y: 35,
          opacity: 0,
          scale: 0.98,
          duration: 0.75,
          ease: 'power3.out',
        }, '-=0.4');
      }
    }, heroRef.current);

    return () => ctx.revert();
  }, []);

  return { heroRef, demoRef };
}
