// FILE: src/app/(admin)/admin/analytics/parts/EmptyStateNotice.tsx
// Full-page single-message state (server-safe). Used for the "not configured" (503)
// and "access denied" (401/403) cases so the page never renders a half-dashboard.
export default function EmptyStateNotice({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 className="font-display" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--ink)', marginBottom: 10 }}>{title}</h1>
      <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}
