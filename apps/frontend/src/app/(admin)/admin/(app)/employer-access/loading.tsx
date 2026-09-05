// FILE: /admin/employer-access loading — simple list skeleton.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function EmployerAccessLoading() {
  return (
    <div>
      <SkeletonLine width="40%" height={30} style={{ marginBottom: 20 }} />
      <SkeletonLine height={60} style={{ borderRadius: 12, marginBottom: 20 }} />
      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLine key={i} height={52} style={{ borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}
