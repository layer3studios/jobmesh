// FILE: /pipeline loading: the workspace frame, a title, and five row-shaped bars.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function PipelineLoading() {
  return (
    <div className="td-skel" aria-busy="true" aria-label="Loading pipeline">
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
        <SkeletonLine width="60px" height={11} style={{ marginBottom: 12 }} />
        <SkeletonLine width="min(300px, 50%)" height={40} style={{ marginBottom: 24 }} />
        <div className="glass ws-section" style={{ display: 'grid', gap: 10 }}>
          <SkeletonLine width="80px" height={11} />
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLine key={i} height={64} style={{ borderRadius: 11, opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </section>
    </div>
  );
}
