// FILE: src/app/(admin)/admin/analytics/loading.tsx
// Route-level skeleton shown while the server page fetches. Mirrors the real layout:
// a KPI-tile row, a bar-chart block, and two donut placeholders.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

function Block({ height }: { height: number }) {
  return <div className="anim-pulse" style={{ ...shimmer, height }} />;
}

export default function Loading() {
  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ ...shimmer, height: 34, width: 180, marginBottom: 28 }} className="anim-pulse" />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {Array.from({ length: 4 }).map((_, i) => <Block key={i} height={96} />)}
      </div>
      <div style={{ marginTop: 28 }}><Block height={220} /></div>
      <div style={{ marginTop: 28, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <Block height={240} />
        <Block height={240} />
      </div>
    </div>
  );
}
