// FILE: /jobs loading — the board's own skeleton: search band, three filter
// chips, then rows shaped like the rows they stand in for.
import { ListSkeleton } from '../../../components/seeker/dashboard/DashboardBody';
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function JobsLoading() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px' }}>
      <SkeletonLine width="180px" height={11} style={{ marginBottom: 12 }} />
      <SkeletonLine height={44} style={{ borderRadius: 12, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[88, 104, 100, 80].map((w, i) => <SkeletonLine key={i} width={`${w}px`} height={32} style={{ borderRadius: 8 }} />)}
      </div>
      <ListSkeleton rows={10} />
    </div>
  );
}
