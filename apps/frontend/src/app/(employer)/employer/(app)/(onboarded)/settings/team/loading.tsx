// FILE: settings/team loading — skeleton matching the members + invites layout.
import { SkeletonLine } from '@/components/ui/Skeleton';

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <SkeletonLine height={40} style={{ borderRadius: 0 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} height={56} style={{ borderRadius: 0, marginTop: 1 }} />
      ))}
    </div>
  );
}

export default function TeamSettingsLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <SkeletonLine width="30%" height={34} />
        <SkeletonLine width="150px" height={38} style={{ borderRadius: 8, opacity: 0.6 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonLine width="90px" height={20} />
        <TableSkeleton rows={3} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonLine width="130px" height={20} />
        <TableSkeleton rows={2} />
      </div>
    </div>
  );
}
