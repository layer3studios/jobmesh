'use client';
// FILE: src/components/seeker/SeekerWorkspace.tsx
// The frame for Pipeline and Profile (reference DESIGN.md): the week board as a
// 280px sticky sidebar, with the amber→indigo seam on its right edge, and a
// fluid content column. Today has its own full-width editorial layout. The card carries today's numbers
// and quiet links to the other two pages; identity lives in the top nav.
// Under 1024px the card sits above the content.
import type { ReactNode } from 'react';
import { useSeeker } from '../../context/seeker/SeekerContext';
import GoalPanel from './today/GoalPanel';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function SeekerWorkspace({ children, label, title, actions }: {
  children: ReactNode;
  /** Mono eyebrow above the page title. */
  label?: string;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  const { todayCount, dailyGoal, streak, appliedJobs, saveDailyGoal } = useSeeker();

  return (
    <div className="ws-frame">
      <GoalPanel
        appliedJobs={appliedJobs}
        todayCount={todayCount}
        dailyGoal={dailyGoal}
        streak={streak}
        onGoalChange={saveDailyGoal}
      />

      <section style={{ minWidth: 0 }}>
        {(title || label) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              {label && <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>{label}</p>}
              {title && <h1 className="font-display" style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance', color: 'var(--ink)' }}>{title}</h1>}
            </div>
            {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
          </div>
        )}
        {children}
      </section>
    </div>
  );
}
