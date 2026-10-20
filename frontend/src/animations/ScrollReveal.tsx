/**
 * ScrollReveal — Reusable GSAP ScrollTrigger wrapper
 * ───────────────────────────────────────────────────
 * Wraps children in a div that fades-up on scroll.
 * Respects prefers-reduced-motion.
 * Cleans up ScrollTrigger on unmount.
 */
import { useRef, useEffect, type ReactNode, type ElementType } from 'react';
import { gsap, EASE_ENTER, DUR_NORMAL, STAGGER, prefersReducedMotion } from './gsap-init';

interface ScrollRevealProps {
  children: ReactNode;
  /** CSS class to add to the wrapper */
  className?: string;
  /** Stagger children? If true, each direct child animates in sequence */
  stagger?: boolean;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Custom y-offset to animate from */
  y?: number;
  /** Trigger start position */
  start?: string;
  /** HTML tag for wrapper */
  as?: ElementType;
}

export default function ScrollReveal({
  children,
  className = '',
  stagger: useStagger = false,
  delay = 0,
  y = 40,
  start = 'top 88%',
  as: Component = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const el = ref.current;
    const targets = useStagger ? el.children : el;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: DUR_NORMAL,
        ease: EASE_ENTER,
        delay,
        stagger: useStagger ? STAGGER : 0,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none none',
        },
      });
    }, el);

    return () => ctx.revert();
  }, [useStagger, delay, y, start]);

  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
