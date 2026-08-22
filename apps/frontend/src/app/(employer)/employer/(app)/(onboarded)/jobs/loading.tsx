// FILE: /employer/jobs loading — table row skeletons.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function EmployerJobsLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <SkeletonLine width="30%" height={30} />
        <SkeletonLine width="120px" height={40} style={{ borderRadius: 10 }} />
      </div>
      <SkeletonLine height={40} style={{ borderRadius: 8, marginBottom: 4 }} />
      <div style={{ display: 'grid', gap: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLine key={i} height={52} style={{ borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}
