// FILE: /company/[companySlug] loading — org header + role card skeletons.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function CompanyLoading() {
  return (
    <div className="container-lg" style={{ padding: '48px 16px' }}>
      <SkeletonLine width="45%" height={30} style={{ marginBottom: 6 }} />
      <SkeletonLine width="30%" height={16} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} height={92} style={{ borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
