// FILE: /jobs/[jobId] loading — header (title + company) + body blocks.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function JobDetailLoading() {
  return (
    <div className="container-lg" style={{ padding: '32px 16px' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
          <SkeletonLine width="48px" height={48} style={{ borderRadius: 11, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="70%" height={22} style={{ marginBottom: 8 }} />
            <SkeletonLine width="40%" height={14} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLine key={i} width={i % 3 === 2 ? '65%' : '100%'} height={14} />
          ))}
        </div>
      </div>
    </div>
  );
}
