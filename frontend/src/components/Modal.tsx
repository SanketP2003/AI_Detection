import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
  maxWidth = 480,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: `${maxWidth}px`,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg, 20px)',
          boxShadow: 'var(--shadow-elevated, 0 20px 40px rgba(0, 0, 0, 0.12))',
          padding: '28px',
          position: 'relative',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-sm, 8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        {eyebrow && (
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              marginBottom: '6px',
            }}
          >
            {eyebrow}
          </span>
        )}

        {title && (
          <h2
            style={{
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0 0 16px 0',
              paddingRight: '32px',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
