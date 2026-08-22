// FILE: /jobs loading — filter bar + ~8 job-card skeletons.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function JobsLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px' }}>
      <SkeletonLine width="30%" height={28} style={{ marginBottom: 8 }} />
      <SkeletonLine width="20%" height={16} style={{ marginBottom: 20 }} />
      <SkeletonLine height={44} style={{ borderRadius: 10, marginBottom: 16 }} />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLine key={i} height={92} style={{ borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
