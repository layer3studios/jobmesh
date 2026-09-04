'use client';
// FILE: src/components/seeker/SeekerWorkspace.tsx
// The signed-in seeker's three-zone frame (reference DESIGN.md): a 280px glass
// sidebar — identity, mono stats, section nav — with the amber→indigo seam on
// its right edge, and a fluid content column. Today, Progress, Resume and
// Profile all render inside it so the account pages read as one workspace.
// Under 1024px the sidebar folds into a chip row above the content.
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSeeker } from '../../context/seeker/SeekerContext';
import { Avatar } from '../ui/Avatar';
import { useViewport } from '@/hooks/shared/useViewport';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

const SECTIONS = [
  { to: '/today', label: 'Today' },
  { to: '/progress', label: 'Progress' },
  { to: '/resume', label: 'Resume' },
  { to: '/profile', label: 'Profile' },
] as const;

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <div className="font-display" style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function SeekerWorkspace({ children, label, title, actions }: {
  children: ReactNode;
  /** Mono eyebrow above the page title. */
  label?: string;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, todayCount, streak, appliedJobs } = useSeeker();
  const { width } = useViewport();
  const stacked = width < 1024;
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');

  const nav = (
    <nav aria-label="Account" style={{ display: 'flex', flexDirection: stacked ? 'row' : 'column', gap: stacked ? 6 : 2, flexWrap: 'wrap' }}>
      {SECTIONS.map(s => (
        <Link
          key={s.to}
          href={s.to}
          className="ws-link"
          aria-current={isActive(s.to) ? 'page' : undefined}
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: stacked ? '7px 12px' : '9px 12px', borderRadius: 8,
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
            color: isActive(s.to) ? 'var(--ink)' : 'var(--ink-muted)',
            background: isActive(s.to) ? 'var(--accent-soft)' : 'transparent',
            border: stacked ? '1px solid var(--border)' : '1px solid transparent',
          }}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div style={{
      width: '100%', maxWidth: 1440, margin: '0 auto',
      padding: stacked ? '16px 16px 80px' : '24px var(--margin-page) 48px',
      display: 'grid',
      gridTemplateColumns: stacked ? '1fr' : 'var(--sidebar-width) minmax(0, 1fr)',
      gap: stacked ? 16 : 32, alignItems: 'start',
    }}>
      <aside
        className="glass ws-side"
        style={{
          position: stacked ? 'static' : 'sticky', top: 88,
          borderRadius: 14, padding: stacked ? 14 : 20,
          display: 'flex', flexDirection: stacked ? 'row' : 'column',
          alignItems: stacked ? 'center' : 'stretch', gap: stacked ? 14 : 22, flexWrap: 'wrap',
        }}
      >
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Avatar name={currentUser.name} src={currentUser.picture} size={stacked ? 'sm' : 'md'} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
              {!stacked && <div style={{ fontSize: 12, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>}
            </div>
          </div>
        )}

        {!stacked && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <Stat value={todayCount} label="Today" />
            <Stat value={streak} label="Streak" />
            <Stat value={appliedJobs.length} label="Applied" />
          </div>
        )}

        <div style={{ paddingTop: stacked ? 0 : 18, borderTop: stacked ? 'none' : '1px solid var(--border)', marginLeft: stacked ? 'auto' : 0 }}>
          {nav}
        </div>
      </aside>

      <section style={{ minWidth: 0 }}>
        {(title || label) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              {label && <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>{label}</p>}
              {title && <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--ink)' }}>{title}</h1>}
            </div>
            {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
          </div>
        )}
        {children}
      </section>
    </div>
  );
}
