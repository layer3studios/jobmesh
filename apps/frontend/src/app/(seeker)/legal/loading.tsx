// FILE: /legal loading — simple prose skeleton.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function LegalLoading() {
  return (
    <div className="container-md" style={{ padding: '40px 16px' }}>
      <SkeletonLine width="40%" height={30} style={{ marginBottom: 8 }} />
      <SkeletonLine width="25%" height={14} style={{ marginBottom: 28 }} />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonLine key={i} width={i % 4 === 3 ? '55%' : '100%'} height={14} />
        ))}
      </div>
    </div>
  );
}
