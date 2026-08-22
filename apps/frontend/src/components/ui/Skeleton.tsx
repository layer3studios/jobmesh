// FILE: src/components/ui/Skeleton.tsx
// Loading placeholders. SkeletonLine for single bars, SkeletonCard for a
// card-shaped cluster. Both use the global `shimmer` keyframe.
import type { CSSProperties } from 'react';
import { RADIUS } from '../../theme/tokens';

const SHIMMER: CSSProperties = {
  background: 'linear-gradient(90deg, var(--paper-2) 25%, var(--surface-muted) 37%, var(--paper-2) 63%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: RADIUS.xs,
};

export function SkeletonLine({
  width = '100%', height = 14, style,
}: {
  width?: string;
  height?: number;
  style?: CSSProperties;
}) {
  return <div aria-hidden style={{ ...SHIMMER, width, height, ...style }} />;
}

export function SkeletonCard({
  lines = 3, style,
}: {
  lines?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        padding: 16, borderRadius: RADIUS.lg,
        border: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', flexDirection: 'column', gap: 12, ...style,
      }}
    >
      <SkeletonLine width="40%" height={18} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}
