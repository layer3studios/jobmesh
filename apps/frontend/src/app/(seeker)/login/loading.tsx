// FILE: /login loading — centered login card skeleton.
import { SkeletonLine } from '../../../components/ui/Skeleton';

export default function LoginLoading() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
        <SkeletonLine width="120px" height={24} style={{ marginBottom: 22 }} />
        <SkeletonLine width="70%" height={28} style={{ marginBottom: 12 }} />
        <SkeletonLine width="90%" height={14} style={{ marginBottom: 24 }} />
        <SkeletonLine height={44} style={{ borderRadius: 10, marginBottom: 18 }} />
        <div style={{ display: 'grid', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} height={20} />
          ))}
        </div>
      </div>
    </div>
  );
}
