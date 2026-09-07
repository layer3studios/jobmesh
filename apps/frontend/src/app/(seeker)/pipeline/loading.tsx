// FILE: /pipeline loading: the workspace frame, a title, and five row-shaped bars.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function PipelineLoading() {
  return (
    <div className="td-skel" aria-busy="true" aria-label="Loading pipeline">
      <aside className="glass td-skel__side">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SkeletonLine width="36px" height={36} style={{ borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'grid', gap: 6 }}>
            <SkeletonLine width="55%" height={14} />
            <SkeletonLine width="80%" height={11} />
          </div>
        </div>
        <div className="td-skel__rule" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <SkeletonLine width="50%" height={26} />
          <SkeletonLine width="50%" height={26} />
          <SkeletonLine width="50%" height={26} />
        </div>
        <div className="td-skel__rule" />
        <SkeletonLine height={38} style={{ borderRadius: 8 }} />
        <SkeletonLine height={38} style={{ borderRadius: 8, opacity: 0.6 }} />
        <SkeletonLine height={38} style={{ borderRadius: 8, opacity: 0.4 }} />
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
