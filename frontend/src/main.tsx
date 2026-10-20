import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const CLERK_PUBLISHABLE_KEY =
  ((import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ||
  ((import.meta as any).env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined) ||
  'pk_test_Zm9uZC10ZWFsLTg0LmNsZXJrLmFjY291bnRzLmRldiQ';

const rootElement = document.getElementById('root')!;

if (!CLERK_PUBLISHABLE_KEY) {
  createRoot(rootElement).render(
    <StrictMode>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0d110e',
          color: '#e8ece9',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            padding: '32px',
            borderRadius: '16px',
            background: '#151b17',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px', color: '#fff', letterSpacing: '-0.02em' }}>
            Configuration Missing
          </h1>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#9ba39d', margin: '0 0 20px' }}>
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
              VITE_CLERK_PUBLISHABLE_KEY
            </code>{' '}
            is not configured. Please define this key in your <code>frontend/.env</code> environment file to initialize
            authentication.
          </p>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#68706a', fontWeight: 600 }}>
            AI Verify Authentication
          </span>
        </div>
      </div>
    </StrictMode>,
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}

