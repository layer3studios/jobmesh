'use client';
// FILE: src/components/seeker/ProgressRing.tsx
import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';

interface Props {
  todayCount: number;
  dailyGoal: number;
  onGoalChange?: (g: number) => void;
}

export default function ProgressRing({ todayCount, dailyGoal, onGoalChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(dailyGoal));

  const size = 140;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.round((todayCount / Math.max(1, dailyGoal)) * 100));
  const offset = circ - (pct / 100) * circ;
  const isMet = todayCount >= dailyGoal;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={isMet ? 'var(--success)' : 'var(--accent)'}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div className="font-display" style={{
            fontSize: '1.85rem', fontWeight: 600,
            color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.025em',
            fontVariantNumeric: 'tabular-nums',
          }}>{todayCount}</div>
          <div style={{
            fontSize: '0.7rem', color: 'var(--ink-muted)',
            marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
          }}>
            of {dailyGoal}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
          Today's progress
        </div>
        <div className="font-display" style={{
          fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
          fontWeight: 600,
          color: 'var(--ink)',
          marginTop: 6,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {isMet ? "You hit today's goal." : `${dailyGoal - todayCount} to go`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>Daily goal:</span>
          {editing && onGoalChange ? (
            <>
              <input
                type="number"
                min={1}
                max={50}
                value={val}
                onChange={e => setVal(e.target.value)}
                style={{
                  width: 56, padding: '4px 8px',
                  fontFamily: 'inherit', fontSize: '0.82rem',
                  background: 'var(--surface)', color: 'var(--ink)',
                  border: '1px solid var(--border-strong)', borderRadius: 7,
                }}
              />
              <button
                onClick={() => { onGoalChange(Number(val) || 5); setEditing(false); }}
                style={{ ...iconBtn, color: 'var(--success)' }}
                aria-label="Save"
              >
                <Check size={12} />
              </button>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{dailyGoal}/day</span>
              {onGoalChange && (
                <button onClick={() => { setVal(String(dailyGoal)); setEditing(true); }} style={iconBtn} aria-label="Edit goal">
                  <Pencil size={11} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6,
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--ink-muted)', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
