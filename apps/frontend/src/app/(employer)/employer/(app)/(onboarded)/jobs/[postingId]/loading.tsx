// FILE: /employer/jobs/[postingId] loading — tabs + kanban column skeleton.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function PostingDetailLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px' }}>
      <SkeletonLine width="50%" height={28} style={{ marginBottom: 6 }} />
      <SkeletonLine width="30%" height={14} style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} width="100px" height={34} style={{ borderRadius: 8 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} style={{ flex: 1, minWidth: 220 }}>
            <SkeletonLine width="60%" height={16} style={{ marginBottom: 10 }} />
            <div style={{ display: 'grid', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonLine key={i} height={72} style={{ borderRadius: 10 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
