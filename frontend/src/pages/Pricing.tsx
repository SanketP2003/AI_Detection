import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button, Badge } from '../components/CommonUI';
import { useAuth } from '../context/AuthContext';
import { getBillingPlans, createCheckoutSession, PlanDefinition } from '../api/client';

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getBillingPlans()
      .then((data) => {
        if (isMounted) {
          if (data && data.length > 0) {
            setPlans(data);
          }
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

  const handleCtaClick = async (planId: string) => {
    setErrorMsg(null);
    const cleanId = planId.toUpperCase();

    if (cleanId === 'FREE') {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/signup');
      }
      return;
    }

    if (cleanId === 'TEAM') {
      window.location.href = 'mailto:sales@aiverify.com?subject=AI%20Verify%20Team%20Plan%20Inquiry';
      return;
    }

    // PRO plan checkout
    if (!user) {
      navigate(`/signup?next=/pricing&plan=pro`);
      return;
    }

    try {
      setCheckoutLoading(true);
      const res = await createCheckoutSession('PRO', interval);
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg('Unable to initiate checkout session. Please try again.');
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setErrorMsg('Billing is not enabled on this deployment.');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Checkout failed. Please try again.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const faqs = [
    {
      q: 'What counts as an analysis?',
      a: 'Each text passage or uploaded document submitted to the AI Verify detection engine counts as one analysis. Limits reset on the first day of each billing cycle.',
    },
    {
      q: 'What happens when I reach my monthly limit?',
      a: 'Once your limit is reached, new analysis requests return a quota notice until your cycle resets or you upgrade. Your existing scan history, analytics, and exported reports remain accessible.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. You can cancel your subscription at any time through your workspace settings or billing portal. You will retain full access through the end of your prepaid billing period.',
    },
    {
      q: 'Is my submitted text stored or used for model training?',
      a: 'No. AI Verify analyzes text patterns ephemerally for statistical entropy, perplexity, and burstiness. We do not use customer data to train language models.',
    },
    {
      q: 'How do refunds work?',
      a: 'If you are unsatisfied within the first 14 days of your initial paid subscription, contact support for a full, prompt refund.',
    },
    {
      q: 'Are taxes and VAT included in the price?',
      a: 'Quoted prices exclude applicable local sales tax, VAT, or GST. Taxes are calculated automatically at checkout based on your billing jurisdiction.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '72px 24px 84px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ maxWidth: '720px', margin: '0 auto 40px auto', textAlign: 'center' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              PRICING
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                fontSize: '40px',
                lineHeight: 1.15,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: 'var(--ink)',
                margin: '0 0 16px 0',
              }}
            >
              Straightforward plans for empirical verification
            </h1>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              Empirical linguistic stylometry and pattern detection for independent researchers, academic teams, and organizations.
            </p>

            {/* Monthly / Annual Toggle */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '28px',
                padding: '4px',
                backgroundColor: 'var(--surface-2)',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            >
              <button
                type="button"
                onClick={() => setInterval('monthly')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: interval === 'monthly' ? '1px solid var(--line)' : '1px solid transparent',
                  backgroundColor: interval === 'monthly' ? 'var(--surface)' : 'transparent',
                  color: interval === 'monthly' ? 'var(--ink)' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setInterval('yearly')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: interval === 'yearly' ? '1px solid var(--line)' : '1px solid transparent',
                  backgroundColor: interval === 'yearly' ? 'var(--surface)' : 'transparent',
                  color: interval === 'yearly' ? 'var(--ink)' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Annual billing</span>
                <Badge tone="sage">2 months free</Badge>
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--amber-bg)',
                  color: 'var(--amber)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}
          </div>

          {/* Three Plan Columns in ONE Surface Container */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg, 20px)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              marginBottom: '64px',
            }}
          >
            {/* 1. FREE PLAN */}
            <div
              style={{
                padding: '36px 32px',
                borderRight: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Free
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                      fontSize: '40px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    $0
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>/ month</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                  Essential pattern verification for casual reviewers.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <Button
                  kind="secondary"
                  onClick={() => handleCtaClick('FREE')}
                  style={{ width: '100%' }}
                >
                  Start free
                </Button>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px', letterSpacing: '0.06em' }}>
                  Included capabilities
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    '20 analyses per month',
                    'Up to 5,000 characters per scan',
                    '2 MB maximum file upload',
                    '10 advisor questions per month',
                    '30-day history retention',
                    'Single workspace user',
                    'Community support',
                  ].map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. PRO PLAN (emphasized with 1px green top border & sage badge) */}
            <div
              style={{
                padding: '36px 32px',
                borderRight: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
                borderTop: '2px solid var(--green)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: '16px', right: '24px' }}>
                <Badge tone="sage">Most popular</Badge>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Pro
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                      fontSize: '40px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {interval === 'yearly' ? '$190' : '$19'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {interval === 'yearly' ? '/ year' : '/ month'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                  For researchers, editors, and heavy forensic workloads.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <Button
                  kind="primary"
                  onClick={() => handleCtaClick('PRO')}
                  disabled={checkoutLoading}
                  style={{ width: '100%' }}
                >
                  {checkoutLoading ? 'Redirecting…' : 'Start 14-day trial'}
                </Button>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px', letterSpacing: '0.06em' }}>
                  Everything in Free, plus
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    '1,000 analyses per month',
                    'Up to 50,000 characters per scan',
                    '10 MB maximum file upload',
                    '300 advisor questions per month',
                    '365-day history retention',
                    'Full CSV & JSON report export',
                    '7-day payment grace period',
                    'Standard email support',
                  ].map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. TEAM PLAN */}
            <div
              style={{
                padding: '36px 32px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Team
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                      fontSize: '40px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    $49
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>/ seat / month</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                  Collaborative workspaces with pooled quotas and API access.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <Button
                  kind="secondary"
                  onClick={() => handleCtaClick('TEAM')}
                  style={{ width: '100%' }}
                >
                  Contact sales
                </Button>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px', letterSpacing: '0.06em' }}>
                  Everything in Pro, plus
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    '10,000 analyses / month (pooled)',
                    'Up to 200,000 characters per scan',
                    '25 MB maximum file upload',
                    '2,000 advisor questions / month',
                    '730-day history retention',
                    '3 to 25 collaborative seats',
                    'REST API access enabled',
                    'Priority email support',
                  ].map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Plan Comparison Table */}
          <div style={{ marginBottom: '72px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '20px',
                letterSpacing: '-0.02em',
              }}
            >
              Plan comparison
            </h2>

            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md, 14px)',
                overflowX: 'auto',
                backgroundColor: 'var(--surface)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', backgroundColor: 'var(--surface-2)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--ink)', width: '34%' }}>Feature</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--ink)', width: '22%' }}>Free</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--green)', width: '22%' }}>Pro</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--ink)', width: '22%' }}>Team</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Monthly analyses', '20 / mo', '1,000 / mo', '10,000 / mo (pooled)'],
                    ['Max characters per scan', '5,000 chars', '50,000 chars', '200,000 chars'],
                    ['Max upload file size', '2 MB', '10 MB', '25 MB'],
                    ['AI Advisor questions', '10 / mo', '300 / mo', '2,000 / mo (pooled)'],
                    ['History retention', '30 days', '365 days', '730 days'],
                    ['Team seats', '1 seat', '1 seat', '3–25 seats'],
                    ['CSV & JSON export', '—', 'Included', 'Included'],
                    ['REST API access', '—', '—', 'Included'],
                    ['Support tier', 'Community', 'Standard email', 'Priority email'],
                    ['Overage policy', 'Hard stop at limit', '7-day soft grace', '7-day soft grace'],
                  ].map(([label, freeVal, proVal, teamVal], idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx < 9 ? '1px solid var(--line)' : 'none',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink)' }}>{label}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--muted)' }}>{freeVal}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--ink)', fontWeight: 600 }}>{proVal}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--ink)' }}>{teamVal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div style={{ maxWidth: '840px', margin: '0 auto 56px auto' }}>
            <h2
              style={{
                fontFamily: 'var(--font-sora, "Sora", sans-serif)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '20px',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}
            >
              Frequently asked questions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-md, 14px)',
                      backgroundColor: 'var(--surface)',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0 20px 16px 20px',
                          fontSize: '13px',
                          lineHeight: 1.6,
                          color: 'var(--muted)',
                          borderTop: '1px solid var(--line)',
                          paddingTop: '14px',
                        }}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mandatory Disclaimers & Footnotes */}
          <div
            style={{
              maxWidth: '840px',
              margin: '0 auto',
              paddingTop: '24px',
              borderTop: '1px solid var(--line)',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--muted)',
              lineHeight: 1.7,
            }}
          >
            <p style={{ margin: '0 0 6px 0' }}>
              Prices exclude tax where applicable. Entitlement quotas reset monthly on the billing cycle date.
            </p>
            <p style={{ margin: 0, fontWeight: 500 }}>
              AI pattern scores represent statistical stylometric markers and are not conclusive proof of authorship.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
