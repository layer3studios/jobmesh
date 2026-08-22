// FILE: /directory loading — grid of ~12 company-card skeletons.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function DirectoryLoading() {
  return (
    <div className="container-xl" style={{ padding: '40px 16px' }}>
      <SkeletonLine width="40%" height={32} style={{ marginBottom: 8 }} />
      <SkeletonLine width="55%" height={16} style={{ marginBottom: 24 }} />
      <div className="companies-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonLine key={i} height={150} style={{ borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
