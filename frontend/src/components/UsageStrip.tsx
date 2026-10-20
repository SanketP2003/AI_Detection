import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsage, UsageResponse } from '../api/client';

export default function UsageStrip() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getUsage()
      .then((data) => {
        if (isMounted) {
          setUsage(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !usage) return null;

  const scans = usage.entitlements.scans;
  if (!scans) return null;

  const used = scans.used ?? 0;
  const limit = scans.limit ?? 20;
  const percent = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const isNearLimit = percent >= 80 && percent < 100;
  const isAtLimit = percent >= 100;

  let resetDateFormatted = '';
  if (scans.resetsAt) {
    try {
      resetDateFormatted = new Date(scans.resetsAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      resetDateFormatted = '';
    }
  }

  const trackColor = 'var(--surface-2)';
  const fillColor = isAtLimit || isNearLimit ? 'var(--amber)' : 'var(--green)';
  const textColor = isAtLimit || isNearLimit ? 'var(--amber)' : 'var(--muted)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '8px 0 24px 0',
        fontSize: '11px',
        color: textColor,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {used} of {limit} analyses used
        {resetDateFormatted ? ` • Resets ${resetDateFormatted}` : ''}
      </span>

      {/* 6px progress track */}
      <div
        style={{
          width: '120px',
          height: '6px',
          backgroundColor: trackColor,
          borderRadius: '3px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: fillColor,
            borderRadius: '3px',
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>

      <Link
        to="/pricing"
        style={{
          color: 'var(--green)',
          fontWeight: 700,
          textDecoration: 'none',
          marginLeft: '4px',
        }}
      >
        View plans →
      </Link>
    </div>
  );
}
