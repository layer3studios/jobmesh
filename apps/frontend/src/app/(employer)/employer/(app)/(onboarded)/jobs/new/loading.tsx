// FILE: /employer/jobs/new loading — posting form skeleton.
import { SkeletonLine } from '@/components/ui/Skeleton';
import { PageShell } from '@/components/ui';

export default function EmployerJobNewLoading() {
  return (
    <PageShell width="wide">
      <SkeletonLine width="45%" height={30} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <SkeletonLine width="30%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonLine height={i === 5 ? 120 : 40} style={{ borderRadius: 8 }} />
          </div>
        ))}
        <SkeletonLine width="150px" height={44} style={{ borderRadius: 10 }} />
      </div>
    </PageShell>
  );
}
