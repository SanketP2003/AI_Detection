import React from 'react';

export function Button({
  children,
  onClick,
  kind = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  style,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <button
      type={type}
      className={`button ${kind} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
  style,
}: {
  children: React.ReactNode;
  tone?: 'sage' | 'amber' | 'green' | 'neutral' | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`badge ${tone} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}

export function ScoreRing({ value = 0 }: { value?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const toneColor = clamped >= 60 ? 'var(--amber)' : clamped <= 35 ? 'var(--green)' : 'var(--muted)';
  return (
    <div
      className="score-ring"
      style={
        {
          '--score': `${clamped * 3.6}deg`,
          '--score-color': toneColor,
        } as React.CSSProperties
      }
    >
      <div>
        <strong>{clamped}%</strong>
        <span>AI pattern score</span>
      </div>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}
