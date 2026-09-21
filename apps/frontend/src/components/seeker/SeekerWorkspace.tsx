'use client';
// FILE: src/components/seeker/SeekerWorkspace.tsx
// The frame for the seeker's account pages (Pipeline, Profile), set like
// Today: full width, no sidebar, a masthead with a mono kicker, the title in
// the serif, an optional tally line of numbers, and the page's actions on the
// right. Sections below use the same hairline grammar (EdSection).
import type { ReactNode } from 'react';

export interface TallyItem { value: ReactNode; label: string }

export function Tally({ items, small }: { items: TallyItem[]; small?: boolean }) {
  return (
    <p className={`daily__tally${small ? ' daily__tally--sm' : ''}`}>
      {items.map((t, i) => (
        <span key={t.label} style={{ display: 'contents' }}>
          {i > 0 && <span className="daily__tally-sep" aria-hidden>/</span>}
          <span><b>{t.value}</b> {t.label}</span>
        </span>
      ))}
    </p>
  );
}

export default function SeekerWorkspace({ children, label, title, lede, tally, actions }: {
  children: ReactNode;
  /** Mono kicker above the title. */
  label?: string;
  title?: ReactNode;
  /** One sentence under the title, in the voice of the page. */
  lede?: ReactNode;
  /** Mono numbers along the bottom of the masthead. */
  tally?: TallyItem[];
  actions?: ReactNode;
}) {
  return (
    <main className="daily">
      {(title || label) && (
        <header className="mh ws-mast rise" style={{ '--i': 0 } as React.CSSProperties}>
          {label && <p className="mh__dateline"><span>{label}</span></p>}
          <div className="mh__row">
            <div className="ws-mast__main">
              {title && <h1 className="font-display ws-mast__title">{title}</h1>}
              {lede && <p className="mh__line">{lede}</p>}
            </div>
            {actions && <div className="ws-mast__actions">{actions}</div>}
          </div>
          {tally && tally.length > 0 && <div className="ws-mast__tally"><Tally items={tally} /></div>}
        </header>
      )}
      <div className="ws-body rise" style={{ '--i': 1 } as React.CSSProperties}>{children}</div>
    </main>
  );
}
