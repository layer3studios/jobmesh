// FILE: /profile loading: the masthead, the tab strip, and the two panes.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <main className="daily" aria-busy="true" aria-label="Loading your profile">
      <div style={{ paddingTop: 8, borderBottom: '1px solid var(--border-strong)', paddingBottom: 22 }}>
        <SkeletonLine width="120px" height={11} style={{ marginBottom: 18 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <SkeletonLine width="min(360px, 60%)" height={52} />
          <SkeletonLine width="150px" height={38} style={{ borderRadius: 10 }} />
        </div>
        <SkeletonLine width="300px" height={22} style={{ marginTop: 20 }} />
      </div>
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonLine key={i} width="90px" height={34} style={{ borderRadius: 8 }} />)}
        </div>
        <div className="pf-body">
          <div style={{ display: 'grid', gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <SkeletonLine width="30%" height={13} style={{ marginBottom: 6 }} />
                <SkeletonLine height={40} style={{ borderRadius: 8 }} />
              </div>
            ))}
          </div>
          <SkeletonLine height={420} style={{ borderRadius: 16 }} />
        </div>
      </div>
    </main>
  );
}
