'use client';
// FILE: src/components/seeker/today/GoalPanel.tsx
// The seeker's sidebar on every account page: one tilting glass card that
// holds the goal ring, the streak and the total applied, then quiet links to
// the other account pages. The ring is segmented, one arc per application in
// the goal, so the shape itself says how far there is to go. The goal editor
// unfolds from under the chip (transform + opacity only, the drawer curve)
// and folds back on Set or Escape. No name here: identity lives in the nav.
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Briefcase, Minus, Plus, Check, Pencil, ArrowRight } from 'lucide-react';
import TiltCard from './TiltCard';

interface Props {
  todayCount: number;
  dailyGoal: number;
  streak: number;
  totalApplied: number;
  onGoalChange: (n: number) => void;
}

const MIN_GOAL = 1;
const MAX_GOAL = 30;

const PAGES = [
  { to: '/today', label: 'Today' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/profile', label: 'Profile' },
] as const;

/** Counts a number to its new value; jumps straight there under reduced motion. */
function useCountUp(target: number, ms = 700): number {
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { fromRef.current = target; setShown(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick); else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

function headline(todayCount: number, dailyGoal: number): string {
  const left = dailyGoal - todayCount;
  if (left < 0) return 'Past the goal';
  if (left === 0) return 'Done for today';
  if (left === 1) return 'One to go';
  return `${left} to go`;
}

/** One quiet line under the ring, tuned to the streak, the hour and how far along today is. */
function hint(todayCount: number, dailyGoal: number, streak: number, totalApplied: number, hour: number): string {
  const left = dailyGoal - todayCount;
  if (left < 0) return 'Past the goal. Tomorrow starts ahead.';
  if (left === 0) return streak > 1 ? `${streak} days running. Keep the chain.` : 'Done. Anything more is a bonus.';
  if (totalApplied === 0) return 'Each arc is one application. Light the first.';
  if (todayCount === 0 && streak > 0) return `${streak}-day streak on the line. One keeps it.`;
  if (todayCount === 0) return hour >= 18 ? 'Still time for one before the day closes.' : 'Each arc is one application. Light the first.';
  if (left === 1) return 'One more closes the loop.';
  return 'Good pace. Keep it moving.';
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function GoalPanel({ todayCount, dailyGoal, streak, totalApplied, onGoalChange }: Props) {
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(dailyGoal);
  const [now, setNow] = useState<Date | null>(null);
  const editorId = useId();
  const shown = useCountUp(todayCount);
  const isMet = todayCount >= dailyGoal;

  const size = 108;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const n = Math.max(1, Math.min(MAX_GOAL, dailyGoal));
  const gap = n === 1 ? 0 : Math.min(6, circ / n * 0.18);
  const seg = circ / n - gap;

  // The clock is client-only so the server and first client paint agree.
  useEffect(() => { setNow(new Date()); }, []);
  useEffect(() => { if (!editing) setDraft(dailyGoal); }, [dailyGoal, editing]);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditing(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  const save = () => {
    const next = Math.max(MIN_GOAL, Math.min(MAX_GOAL, draft || dailyGoal));
    if (next !== dailyGoal) onGoalChange(next);
    setEditing(false);
  };

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');
  const others = PAGES.filter(p => !isActive(p.to));

  return (
    <TiltCard as="aside" className="ws-side gp-card" max={5}>
      <div className="gp" data-met={isMet ? 'true' : 'false'} data-streak={streak > 0 ? 'true' : 'false'}>
        <div className="gp__top">
          <div className="gp__ring" role="img" aria-label={`${todayCount} of ${dailyGoal} applications today`} title={`${todayCount} of ${dailyGoal} today`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {Array.from({ length: n }).map((_, i) => (
                <circle
                  key={i}
                  className="gp__seg"
                  data-on={i < todayCount ? 'true' : 'false'}
                  style={{ '--k': i } as React.CSSProperties}
                  cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
                  strokeDasharray={`${seg} ${circ - seg}`}
                  strokeDashoffset={-(i * (seg + gap)) + gap / 2}
                />
              ))}
            </svg>
            <div className="gp__center">
              <span className="font-display gp__count" key={todayCount}>{shown}</span>
              <span className="gp__of">of {dailyGoal}</span>
            </div>
          </div>

          <div className="gp__copy">
            <p className="gp__eyebrow">{now ? dateLabel(now) : 'Today'}</p>
            <p className="font-display gp__headline">{headline(todayCount, dailyGoal)}</p>
            <button
              type="button"
              className="gp__goal press press--sm"
              aria-expanded={editing}
              aria-controls={editorId}
              onClick={() => setEditing(v => !v)}
            >
              <span>Goal {dailyGoal}/day</span>
              <Pencil size={11} aria-hidden />
            </button>
          </div>
        </div>

        <div id={editorId} className="gp__editor" data-open={editing ? 'true' : 'false'} aria-hidden={!editing}>
          <div className="gp__editor-inner">
            <button type="button" className="gp__step press press--sm" aria-label="Lower goal" disabled={draft <= MIN_GOAL} tabIndex={editing ? 0 : -1}
              onClick={() => setDraft(d => Math.max(MIN_GOAL, d - 1))}><Minus size={13} /></button>
            <span className="font-display gp__draft" aria-live="polite">{draft}<small>/day</small></span>
            <button type="button" className="gp__step press press--sm" aria-label="Raise goal" disabled={draft >= MAX_GOAL} tabIndex={editing ? 0 : -1}
              onClick={() => setDraft(d => Math.min(MAX_GOAL, d + 1))}><Plus size={13} /></button>
            <button type="button" className="gp__save press press--sm" onClick={save} tabIndex={editing ? 0 : -1}>
              <Check size={13} aria-hidden /> Set
            </button>
          </div>
        </div>

        <p className="gp__hint">{hint(todayCount, dailyGoal, streak, totalApplied, now ? now.getHours() : 12)}</p>

        <div className="gp__stats">
          <div className="gp__stat">
            <span className="gp__stat-v"><Flame size={14} className="gp__flame" aria-hidden />{streak}</span>
            <span className="gp__stat-l">Day streak</span>
          </div>
          <div className="gp__stat">
            <span className="gp__stat-v"><Briefcase size={13} aria-hidden />{totalApplied}</span>
            <span className="gp__stat-l">Applied</span>
          </div>
        </div>

        <nav className="gp__nav" aria-label="Account">
          {others.map(p => (
            <Link key={p.to} href={p.to} className="gp__link press press--sm">
              {p.label} <ArrowRight size={12} aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </TiltCard>
  );
}
