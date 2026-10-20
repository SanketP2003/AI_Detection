/**
 * MagneticButton — Cursor-following CTA with spring physics
 * ──────────────────────────────────────────────────────────
 * Uses Framer Motion for hover/tap micro-interactions.
 * Magnetic pull effect on desktop only (disabled on touch).
 * Maintains full keyboard accessibility.
 */
import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'motion/react';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  kind?: 'primary' | 'secondary' | 'ghost' | 'citrine';
  disabled?: boolean;
  /** Magnetic pull range in pixels */
  range?: number;
}

export default function MagneticButton({
  children,
  onClick,
  className = '',
  kind = 'primary',
  disabled = false,
  range = 35,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (isTouchDevice || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    // Clamp to range
    const dist = Math.sqrt(dx * dx + dy * dy);
    const factor = Math.min(dist, range) / (dist || 1);
    setPosition({ x: dx * factor * 0.3, y: dy * factor * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  // Respect prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`button ${kind} magnetic-btn ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={
        prefersReduced
          ? {}
          : { x: position.x, y: position.y }
      }
      whileHover={prefersReduced ? {} : { scale: 1.04 }}
      whileTap={prefersReduced ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <span className="magnetic-btn-text">{children}</span>
    </motion.button>
  );
}
