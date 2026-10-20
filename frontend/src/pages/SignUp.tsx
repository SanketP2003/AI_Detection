import { useMemo } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function getSafeNext(nextParam: string | null): string {
  if (!nextParam) return '/dashboard';
  if (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\')) {
    return nextParam;
  }
  return '/dashboard';
}

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();

  const nextParam = searchParams.get('next');
  const safeNext = useMemo(() => getSafeNext(nextParam), [nextParam]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={safeNext} replace />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`landing ${resolvedTheme}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <img src="/logo.png" alt="AI Verify" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span>AI Verify</span>
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 460, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>CREATE WORKSPACE ACCOUNT</span>
            <h1 style={{ font: '600 30px/1.2 "Manrope", sans-serif', margin: '8px 0 6px', color: 'var(--ink)' }}>
              Get started with AI Verify
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Access full pattern telemetry, scan persistence, and contextual guidance.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/signin"
              forceRedirectUrl={safeNext}
              appearance={{
                variables: {
                  colorPrimary: '#059669',
                  colorBackground: isDark ? '#0b1215' : '#ffffff',
                  colorText: isDark ? '#f1f5f9' : '#0f172a',
                  colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
                  colorInputBackground: isDark ? '#111c21' : '#f8fafc',
                  colorInputText: isDark ? '#f8fafc' : '#0f172a',
                  borderRadius: '0.75rem',
                  fontFamily: 'Manrope, sans-serif',
                },
                elements: {
                  card: isDark
                    ? 'bg-[#0e171b] border border-[#1b2a32] shadow-2xl text-slate-100'
                    : 'bg-white border border-slate-200 shadow-xl text-slate-900',
                  headerTitle: isDark ? 'text-white' : 'text-slate-900',
                  headerSubtitle: isDark ? 'text-slate-400' : 'text-slate-500',
                  socialButtonsBlockButton: isDark
                    ? 'border-[#22353f] bg-[#142026] text-slate-200 hover:bg-[#1a2b34]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                  formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold',
                  footerActionLink: 'text-emerald-500 hover:text-emerald-400 font-semibold',
                },
              }}
            />
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--line)', padding: '20px 42px', textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
        © {new Date().getFullYear()} AI Verify • Forensic Language Verification
      </footer>
    </div>
  );
}
