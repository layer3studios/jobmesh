// FILE: src/app/(admin)/admin/invites/[token]/loading.tsx
// Minimal centered shimmer while the invite acceptance page resolves.
export default function Loading() {
  return (
    <div style={{ maxWidth: 420, margin: '120px auto', padding: '0 24px' }}>
      <div className="anim-pulse" style={{ background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12, height: 180 }} />
    </div>
  );
}
