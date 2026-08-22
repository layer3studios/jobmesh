// FILE: /profile loading — tabs + form field placeholders.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="container-md" style={{ padding: '32px 16px' }}>
      <SkeletonLine width="40%" height={30} style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} width="90px" height={34} style={{ borderRadius: 8 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <SkeletonLine width="30%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonLine height={40} style={{ borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
