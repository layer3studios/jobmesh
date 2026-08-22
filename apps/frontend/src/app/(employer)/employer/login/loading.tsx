// FILE: /employer/login loading — simple login card.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function EmployerLoginLoading() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <SkeletonLine width="140px" height={24} style={{ marginBottom: 22 }} />
        <SkeletonLine width="70%" height={26} style={{ marginBottom: 12 }} />
        <SkeletonLine width="85%" height={14} style={{ marginBottom: 24 }} />
        <SkeletonLine height={44} style={{ borderRadius: 10 }} />
      </div>
    </div>
  );
}
