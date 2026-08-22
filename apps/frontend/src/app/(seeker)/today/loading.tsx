// FILE: /today loading — hero + picks section + news list.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function TodayLoading() {
  return (
    <div className="container-lg" style={{ padding: '32px 16px' }}>
      <SkeletonLine width="50%" height={34} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} height={88} style={{ borderRadius: 12 }} />
        ))}
      </div>
      <SkeletonLine width="25%" height={18} style={{ marginBottom: 12 }} />
      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} height={44} style={{ borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}
