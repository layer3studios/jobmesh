// FILE: admin/loading.tsx
// Route-level skeleton for Mission Control. Mirrors the real layout: a headline
// block, a KPI row, and the status strip.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

function Block({ height }: { height: number }) {
  return <div className="anim-pulse" style={{ ...shimmer, height }} />;
}

export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="anim-pulse" style={{ ...shimmer, height: 34, width: 220 }} />
      <Block height={110} />
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {Array.from({ length: 5 }).map((_, i) => <Block key={i} height={90} />)}
      </div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {Array.from({ length: 6 }).map((_, i) => <Block key={i} height={62} />)}
      </div>
    </div>
  );
}
