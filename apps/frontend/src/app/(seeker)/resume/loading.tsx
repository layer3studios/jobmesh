// FILE: /resume loading — upload zone + parsed profile skeleton.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function ResumeLoading() {
  return (
    <div className="container-md" style={{ padding: '32px 16px' }}>
      <SkeletonLine width="45%" height={30} style={{ marginBottom: 20 }} />
      <SkeletonLine height={180} style={{ borderRadius: 14, marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} height={56} style={{ borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
