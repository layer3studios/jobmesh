// FILE: src/components/ui/layout.tsx
// Layout primitives: Container, Stack, Divider.
import type { ReactNode, CSSProperties } from 'react';

export function Container({ children, size = 'xl', style, className = '' }: {
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | 'wide' | 'full'; style?: CSSProperties; className?: string;
}) {
  // 'wide'/'full' are for desktop working surfaces (employer app) — let the
  // monitor work. 'full' has NO cap; components manage their own inner widths.
  const maxW = { sm: '640px', md: '768px', lg: '1024px', xl: '1200px', wide: '1536px', full: 'none' }[size];
  return (
    // width:100% is required because Container is rendered inside flex-column
    // parents — without it, the auto side-margins collapse the box to its
    // content width instead of filling out to maxWidth.
    <div className={className} style={{ width: '100%', maxWidth: maxW, margin: '0 auto', padding: '0 clamp(16px, 4vw, 24px)', ...style }}>
      {children}
    </div>
  );
}

export function Stack({ children, gap = 16, dir = 'col', align, justify, wrap, className = '' }: {
  children: ReactNode; gap?: number; dir?: 'row' | 'col'; align?: string; justify?: string; wrap?: boolean; className?: string;
}) {
  return (
    <div className={className} style={{
      display: 'flex', flexDirection: dir === 'col' ? 'column' : 'row',
      gap, alignItems: align, justifyContent: justify, flexWrap: wrap ? 'wrap' : undefined,
    }}>{children}</div>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', ...style }} />;
}
