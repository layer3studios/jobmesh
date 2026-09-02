// FILE: admin/queues/loading.tsx
// Route-level skeleton shown while the segment loads. Mirrors the real layout:
// a header line and a row of queue cards.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

function Block({ height }: { height: number }) {
  return <div className="anim-pulse" style={{ ...shimmer, height }} />;
}

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="anim-pulse" style={{ ...shimmer, height: 34, width: 160 }} />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {Array.from({ length: 3 }).map((_, i) => <Block key={i} height={200} />)}
      </div>
    </div>
  );
}
