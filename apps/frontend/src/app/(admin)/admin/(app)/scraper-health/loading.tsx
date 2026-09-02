// FILE: admin/scraper-health/loading.tsx
// Route-level skeleton shown while the segment loads. Mirrors the real layout:
// a header line, a four-tile corpus strip, site cards, and the run table.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

function Block({ height }: { height: number }) {
  return <div className="anim-pulse" style={{ ...shimmer, height }} />;
}

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="anim-pulse" style={{ ...shimmer, height: 34, width: 200 }} />
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {Array.from({ length: 4 }).map((_, i) => <Block key={i} height={78} />)}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {Array.from({ length: 4 }).map((_, i) => <Block key={i} height={140} />)}
      </div>
      <Block height={260} />
    </div>
  );
}
