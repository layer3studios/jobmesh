// FILE: /employer/jobs/[postingId]/applicants/[applicationId] loading —
// sticky header + panel skeletons.
import { SkeletonLine } from '@/components/ui/Skeleton';
import { PageShell } from '@/components/ui';

export default function ApplicantDetailLoading() {
  return (
    <PageShell width="wide" style={{ paddingBottom: 32 }}>
      <SkeletonLine height={56} style={{ borderRadius: 12, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 20 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLine key={i} height={140} style={{ borderRadius: 12 }} />
          ))}
        </div>
        <SkeletonLine height={460} style={{ borderRadius: 12 }} />
      </div>
    </PageShell>
  );
}
