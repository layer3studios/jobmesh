'use client';
// FILE: src/components/seeker/today/GoalPanel.tsx
// The whole Today sidebar: one tilting glass card that holds the goal ring,
// the streak and the total applied. The ring is segmented, one arc per
// application in the goal, so the shape itself says how far there is to go.
// The goal editor unfolds from under the chip (transform + opacity only, the
// drawer curve) and folds back on Set or Escape.
import { useEffect, useId, useRef, useState } from 'react';
import { Flame, Briefcase, Minus, Plus, Check, Pencil } from 'lucide-react';
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

function hint(todayCount: number, dailyGoal: number, streak: number): string {
  if (todayCount >= dailyGoal) return streak > 1 ? `${streak} days running. Keep the chain.` : 'Each arc is one application.';
  if (todayCount === 0) return 'Each arc is one application. Light the first.';
  return 'Each arc is one application.';
}

export default function GoalPanel({ todayCount, dailyGoal, streak, totalApplied, onGoalChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(dailyGoal);
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
            <p className="gp__eyebrow">Today</p>
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

        <p className="gp__hint">{hint(todayCount, dailyGoal, streak)}</p>

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
      </div>
    </TiltCard>
  );
}
