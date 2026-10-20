export default function PageLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        zIndex: 100,
        gap: 16,
      }}
    >
      <img
        src="/logo.png"
        alt="AI Verify"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/logo.svg';
        }}
        style={{
          width: 44,
          height: 44,
          objectFit: 'contain',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.05em' }}>
        Loading AI Verify…
      </div>
    </div>
  );
}
