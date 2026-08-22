// FILE: /admin/login loading — centered card skeleton while the client bundle loads.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function AdminLoginLoading() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 360, maxWidth: '100%', display: 'grid', gap: 16 }}>
        <SkeletonLine width="50%" height={28} />
        <SkeletonLine width="80%" height={18} />
        <SkeletonLine height={44} style={{ borderRadius: 10, marginTop: 8 }} />
      </div>
    </div>
  );
}
