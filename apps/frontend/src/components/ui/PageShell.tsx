// FILE: src/components/ui/PageShell.tsx
// The page wrapper for EVERY employer and admin page. Replaces the raw Container,
// the hand-written div padding and the one-off Tailwind max-widths that had drifted
// into five different padding values across comparable pages.
//
// Not used by the seeker or apply routes. Those are deliberately different: a job
// feed reads better edge-to-edge on a phone, and an apply form is one narrow column
// with its own measure. Standardising them onto this would be a regression, not
// consistency.
//
// TWO WIDTHS, and the distinction is real. `default` (1280px) is a reading width —
// settings, forms, dashboards. `wide` (1536px) is for data-dense working surfaces
// (the jobs table, the ranked list, admin analytics) that were already running at
// 1536 and would LOSE a column on a large monitor if capped at 1280. The padding is
// identical either way, which is the part that was actually inconsistent.

import type { CSSProperties, ReactNode } from 'react';

export type PageShellWidth = 'default' | 'wide';

export function PageShell({ children, width = 'default', className = '', style }: {
  children: ReactNode;
  width?: PageShellWidth;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: width === 'wide' ? 'var(--page-max-width-wide)' : 'var(--page-max-width)',
        margin: '0 auto',
        padding: 'var(--page-padding-y) var(--page-padding-x)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
