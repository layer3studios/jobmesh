// FILE: src/components/BrandLogo.tsx
// Minimal monogram + wordmark. Notion-style: small icon, refined typography.

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

const SIZES = {
  sm: { svg: 20, text: '0.95rem', gap: 7 },
  md: { svg: 24, text: '1.05rem', gap: 8 },
  lg: { svg: 36, text: '1.5rem', gap: 10 },
} as const;

function Mark({ size }: { size: number }) {
  return (
    <img
      src="/logo.jpg"
      alt="Jobmesh"
      width={size}
      height={size}
      style={{ flexShrink: 0, display: 'block', borderRadius: 7, objectFit: 'contain' }}
    />
  );
}

export default function BrandLogo({ size = 'md', compact = false }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      lineHeight: 1,
      userSelect: 'none',
    }}>
      <Mark size={s.svg} />
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: s.text,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
      }}>
        {compact ? 'Job' : (<>Job<span style={{ color: 'var(--accent)' }}>mesh</span></>)}
      </span>
    </span>
  );
}
