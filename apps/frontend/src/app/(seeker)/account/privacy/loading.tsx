// FILE: /account/privacy loading — sections + toggle skeletons.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function AccountPrivacyLoading() {
  return (
    <div className="container-md" style={{ padding: '32px 16px' }}>
      <SkeletonLine width="40%" height={30} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 14 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ flex: 1, marginRight: 16 }}>
              <SkeletonLine width="45%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLine width="80%" height={12} />
            </div>
            <SkeletonLine width="44px" height={24} style={{ borderRadius: 999 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
