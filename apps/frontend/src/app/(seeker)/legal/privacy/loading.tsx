// FILE: /legal/privacy loading — simple prose skeleton.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function PrivacyLoading() {
  return (
    <div className="container-md" style={{ padding: '40px 16px' }}>
      <SkeletonLine width="45%" height={30} style={{ marginBottom: 8 }} />
      <SkeletonLine width="30%" height={14} style={{ marginBottom: 28 }} />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonLine key={i} width={i % 4 === 3 ? '55%' : '100%'} height={14} />
        ))}
      </div>
    </div>
  );
}
