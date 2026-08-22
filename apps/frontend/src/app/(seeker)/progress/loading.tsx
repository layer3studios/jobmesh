// FILE: /progress loading — pipeline card row + chart placeholder.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function ProgressLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px' }}>
      <SkeletonLine width="35%" height={30} style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} width="140px" height={90} style={{ borderRadius: 12 }} />
        ))}
      </div>
      <SkeletonLine height={220} style={{ borderRadius: 14, marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} height={64} style={{ borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
