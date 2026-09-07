// FILE: /pipeline loading: the workspace frame, a title, and five row-shaped bars.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function PipelineLoading() {
  return (
    <div className="td-skel" aria-busy="true" aria-label="Loading pipeline">
      <aside className="glass td-skel__side">
        <SkeletonLine width="70px" height={10} />
        <SkeletonLine width="60%" height={26} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, alignItems: 'end', height: 80 }}>
          {Array.from({ length: 7 }).map((_, i) => <SkeletonLine key={i} height={64} style={{ borderRadius: 3, opacity: i === 6 ? 0.8 : 0.4 }} />)}
        </div>
        <SkeletonLine width="85%" height={12} />
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
