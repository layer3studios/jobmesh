// FILE: /pipeline loading: the masthead, the stage strip and five row-shaped bars.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function PipelineLoading() {
  return (
    <main className="daily" aria-busy="true" aria-label="Loading pipeline">
      <div style={{ paddingTop: 8, borderBottom: '1px solid var(--border-strong)', paddingBottom: 22 }}>
        <SkeletonLine width="110px" height={11} style={{ marginBottom: 18 }} />
        <SkeletonLine width="min(420px, 60%)" height={52} style={{ marginBottom: 14 }} />
        <SkeletonLine width="min(380px, 70%)" height={16} style={{ marginBottom: 20 }} />
        <SkeletonLine width="320px" height={22} />
      </div>
      <div>
        <SkeletonLine width="90px" height={11} style={{ marginBottom: 10 }} />
        <SkeletonLine width="260px" height={28} style={{ marginBottom: 18 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          {Array.from({ length: 7 }).map((_, i) => <SkeletonLine key={i} height={96} style={{ borderRadius: 8, opacity: 1 - i * 0.1 }} />)}
        </div>
      </div>
      <div>
        <SkeletonLine width="110px" height={11} style={{ marginBottom: 10 }} />
        <SkeletonLine width="240px" height={28} style={{ marginBottom: 18 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} height={64} style={{ borderRadius: 11, marginBottom: 8, opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </main>
  );
}
