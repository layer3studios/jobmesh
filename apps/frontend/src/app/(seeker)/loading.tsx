// FILE: src/app/(seeker)/page loading — Home skeleton (hero + job cards + companies).
import { SkeletonLine } from '../../components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <div className="container-xl" style={{ padding: '48px 16px' }}>
      <SkeletonLine width="60%" height={44} style={{ marginBottom: 14 }} />
      <SkeletonLine width="45%" height={20} style={{ marginBottom: 40 }} />
      <div style={{ display: 'grid', gap: 12, marginBottom: 40 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} height={84} style={{ borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={i} width="200px" height={130} style={{ borderRadius: 12, flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}
