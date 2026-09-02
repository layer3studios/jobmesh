// FILE: admin/seo/loading.tsx
// Route-level skeleton shown while the segment loads. Mirrors the real layout:
// a header, the gap tiles, and the queue card.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="anim-pulse" style={{ ...shimmer, height: 34, width: 200 }} />
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="anim-pulse" style={{ ...shimmer, height: 92 }} />
        ))}
      </div>
      <div className="anim-pulse" style={{ ...shimmer, height: 120 }} />
    </div>
  );
}
