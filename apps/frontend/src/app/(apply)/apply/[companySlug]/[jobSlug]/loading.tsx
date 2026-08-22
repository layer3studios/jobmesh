// FILE: /apply/[companySlug]/[jobSlug] loading — job header + form skeleton.
import { SkeletonLine } from '../../../../../components/ui/Skeleton';

export default function ApplyFormLoading() {
  return (
    <div className="container-md" style={{ padding: '40px 16px' }}>
      <SkeletonLine width="60%" height={26} style={{ marginBottom: 8 }} />
      <SkeletonLine width="40%" height={14} style={{ marginBottom: 28 }} />
      <div style={{ display: 'grid', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <SkeletonLine width="28%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonLine height={i === 4 ? 96 : 40} style={{ borderRadius: 8 }} />
          </div>
        ))}
        <SkeletonLine width="140px" height={44} style={{ borderRadius: 10 }} />
      </div>
    </div>
  );
}
