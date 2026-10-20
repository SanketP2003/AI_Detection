import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { getUsage } from '../api/client';

export default function TrialBanner() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('trial_banner_dismissed') === 'true';
  });

  useEffect(() => {
    if (dismissed) return;

    let isMounted = true;
    getUsage()
      .then((usage) => {
        if (!isMounted) return;
        if (usage.status === 'TRIALING' && usage.trialEnd) {
          const end = new Date(usage.trialEnd).getTime();
          const now = Date.now();
          const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 3) {
            setDaysRemaining(diffDays);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('trial_banner_dismissed', 'true');
  };

  if (dismissed || daysRemaining === null) return null;

  const daysLabel = daysRemaining === 0 ? 'today' : daysRemaining === 1 ? 'in 1 day' : `in ${daysRemaining} days`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        backgroundColor: 'var(--amber-bg)',
        borderBottom: '1px solid var(--line)',
        color: 'var(--amber)',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Trial ends {daysLabel}. Keep full access by adding a payment method.</span>
        <Link
          to="/settings?tab=billing"
          style={{
            color: 'var(--ink)',
            textDecoration: 'underline',
            fontWeight: 700,
          }}
        >
          Add payment method
        </Link>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner for this session"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--amber)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
