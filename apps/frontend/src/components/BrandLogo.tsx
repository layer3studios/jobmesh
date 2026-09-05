// FILE: src/components/BrandLogo.tsx
// Monogram + wordmark for the app chrome. The mark is the landing's BrandMark
// (inline SVG in currentColor), so it sits in ink on both themes; the wordmark
// is the body face, set tight, as on the landing nav.
import BrandMark from './BrandMark';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

const SIZES = {
  sm: { svg: 20, text: '0.95rem', gap: 7 },
  md: { svg: 24, text: '1.05rem', gap: 8 },
  lg: { svg: 36, text: '1.5rem', gap: 10 },
} as const;

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
      <span style={{ color: 'var(--ink)', display: 'flex' }}><BrandMark size={s.svg} /></span>
      <span style={{
        fontFamily: 'inherit',
        fontSize: s.text,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
      }}>
        {compact ? 'Job' : 'JobMesh'}
      </span>
    </span>
  );
}
