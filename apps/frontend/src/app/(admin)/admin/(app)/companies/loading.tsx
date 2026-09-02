// FILE: admin/companies/loading.tsx
// Route-level skeleton shown while the segment loads. Mirrors the real layout:
// a header line and a run of table rows.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="anim-pulse" style={{ ...shimmer, height: 34, width: 180 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="anim-pulse" style={{ ...shimmer, height: 44, borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
