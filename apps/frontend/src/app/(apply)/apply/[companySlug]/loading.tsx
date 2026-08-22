// FILE: /apply/[companySlug] loading — org header + roles list.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function ApplyCompanyLoading() {
  return (
    <div className="container-md" style={{ padding: '40px 16px' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <SkeletonLine width="56px" height={56} style={{ borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="50%" height={24} style={{ marginBottom: 8 }} />
          <SkeletonLine width="35%" height={14} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} height={72} style={{ borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
