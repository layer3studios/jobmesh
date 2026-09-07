// FILE: /today loading. The masthead, the week board and four pick rows at
// the sizes the page paints, so nothing jumps when the data lands.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function TodayLoading() {
  return (
    <main className="daily" aria-busy="true" aria-label="Loading today">
      <div style={{ paddingTop: 8 }}>
        <SkeletonLine width="220px" height={11} style={{ marginBottom: 18 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <SkeletonLine width="min(520px, 70%)" height={64} />
          <SkeletonLine width="200px" height={40} style={{ borderRadius: 10 }} />
        </div>
      </div>
      <div className="daily__board">
        <SkeletonLine width="120px" height={11} style={{ marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14, alignItems: 'end', height: 168 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonLine key={i} height={120} style={{ borderRadius: 8, opacity: 0.35 + (i === 6 ? 0.4 : 0) }} />
          ))}
        </div>
        <SkeletonLine width="260px" height={12} style={{ marginTop: 16 }} />
      </div>
      <div>
        <SkeletonLine width="140px" height={11} style={{ marginBottom: 10 }} />
        <SkeletonLine width="280px" height={28} style={{ marginBottom: 18 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 36px 1fr', gap: 16, alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', opacity: 1 - i * 0.18 }}>
            <SkeletonLine width="20px" height={12} />
            <SkeletonLine width="36px" height={36} style={{ borderRadius: 9 }} />
            <div style={{ display: 'grid', gap: 8 }}>
              <SkeletonLine width={`${52 + (i * 13) % 30}%`} height={18} />
              <SkeletonLine width={`${30 + (i * 9) % 20}%`} height={11} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
