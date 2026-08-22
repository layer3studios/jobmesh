// FILE: assignments loading — skeleton matching the header + library table.
// Mirrors settings/team/loading.tsx; one table instead of two.
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function AssignmentsLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <SkeletonLine width="30%" height={34} />
        <SkeletonLine width="150px" height={38} style={{ borderRadius: 8, opacity: 0.6 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonLine width="110px" height={20} />
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <SkeletonLine height={40} style={{ borderRadius: 0 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} height={64} style={{ borderRadius: 0, marginTop: 1 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
