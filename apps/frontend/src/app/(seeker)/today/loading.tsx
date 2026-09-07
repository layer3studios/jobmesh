// FILE: /today loading. The same frame the page paints into: sidebar (goal
// ring, two stats) beside the greeting and four pick rows. Same boxes,
// same sizes, so nothing jumps when the data lands.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function TodayLoading() {
  return (
    <div className="td-skel" aria-busy="true" aria-label="Loading today">
      <aside className="glass td-skel__side">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <SkeletonLine width="108px" height={108} style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'grid', gap: 8 }}>
            <SkeletonLine width="40%" height={10} />
            <SkeletonLine width="70%" height={22} />
            <SkeletonLine width="55%" height={24} style={{ borderRadius: 999 }} />
          </div>
        </div>
        <SkeletonLine width="80%" height={12} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SkeletonLine width="50%" height={26} />
          <SkeletonLine width="50%" height={26} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <SkeletonLine width="80px" height={30} style={{ borderRadius: 8 }} />
          <SkeletonLine width="80px" height={30} style={{ borderRadius: 8 }} />
        </div>
      </aside>

      <section style={{ minWidth: 0 }}>
        <SkeletonLine width="90px" height={11} style={{ marginBottom: 12 }} />
        <SkeletonLine width="min(260px, 50%)" height={44} style={{ marginBottom: 14 }} />
        <SkeletonLine width="min(380px, 80%)" height={15} style={{ marginBottom: 20 }} />
        <SkeletonLine width="120px" height={38} style={{ borderRadius: 10, marginBottom: 28 }} />
        <div className="glass ws-section" style={{ display: 'grid', gap: 10 }}>
          <SkeletonLine width="140px" height={11} />
          <SkeletonLine width="220px" height={12} style={{ marginBottom: 6 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} height={72} style={{ borderRadius: 12, opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </section>
    </div>
  );
}
