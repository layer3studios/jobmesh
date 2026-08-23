// FILE: /admin/dpdp loading — header plus a short queue skeleton.
import { SkeletonLine } from '@/components/ui/Skeleton';
import { PageShell } from '@/components/ui';

export default function DpdpLoading() {
  return (
    <PageShell width="wide">
      <SkeletonLine width="40%" height={30} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} height={52} style={{ borderRadius: 8 }} />
        ))}
      </div>
    </PageShell>
  );
}
