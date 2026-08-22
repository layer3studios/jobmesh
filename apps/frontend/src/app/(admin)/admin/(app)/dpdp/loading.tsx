// FILE: /admin/dpdp loading — header plus a short queue skeleton.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function DpdpLoading() {
  return (
    <div className="mx-auto w-full max-w-[1536px]" style={{ padding: '24px clamp(16px, 3vw, 32px)' }}>
      <SkeletonLine width="40%" height={30} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} height={52} style={{ borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}
