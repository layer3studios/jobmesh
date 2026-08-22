// FILE: /apply/[companySlug]/[jobSlug]/success loading — simple success skeleton.
import { SkeletonLine } from '../../../../../../components/ui/Skeleton';

export default function ApplySuccessLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <SkeletonLine width="64px" height={64} style={{ borderRadius: 999 }} />
        <SkeletonLine width="70%" height={24} />
        <SkeletonLine width="90%" height={14} />
      </div>
    </div>
  );
}
