// FILE: /employer (dashboard) loading — stats skeleton.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function EmployerDashboardLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px' }}>
      <SkeletonLine width="35%" height={30} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} height={96} style={{ borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} height={64} style={{ borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
