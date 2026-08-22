'use client';
// FILE: src/components/seeker/HeatmapCalendar.tsx
import { useEffect, useMemo, useState } from 'react';
import type { AppliedJobEntry } from '../../types';
import { Z } from '@/theme/tokens';

interface Props {
  appliedJobs: AppliedJobEntry[];
  dailyGoal: number;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HeatmapCalendar({ appliedJobs, dailyGoal }: Props) {
  const [hovered, setHovered] = useState<{ x: number; y: number; date: string; count: number } | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const { weeks, monthLabels } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of appliedJobs) {
      if (!j.appliedAt) continue;
      const d = new Date(j.appliedAt);
      if (isNaN(d.getTime())) continue;
      const k = dateKey(d);
      counts.set(k, (counts.get(k) || 0) + 1);
    }

    const totalWeeks = isMobile ? 14 : 24;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = today.getDay();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - startDay);

    const weeksArr: { date: Date; count: number; isFuture: boolean }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = totalWeeks - 1; w >= 0; w--) {
      const weekArr: { date: Date; count: number; isFuture: boolean }[] = [];
      const weekStart = new Date(lastSunday);
      weekStart.setDate(lastSunday.getDate() - w * 7);
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + dow);
        const isFuture = d > today;
        const k = dateKey(d);
        weekArr.push({ date: d, count: isFuture ? 0 : (counts.get(k) || 0), isFuture });
        if (dow === 0 && d.getMonth() !== lastMonth) {
          months.push({
            label: d.toLocaleString('en-US', { month: 'short' }),
            weekIndex: totalWeeks - 1 - w,
          });
          lastMonth = d.getMonth();
        }
      }
      weeksArr.push(weekArr);
    }
    return { weeks: weeksArr, monthLabels: months };
  }, [appliedJobs, isMobile]);

  const cell = isMobile ? 11 : 13;
  const gap = isMobile ? 3 : 3;

  function color(count: number, isFuture: boolean): string {
    if (isFuture) return 'transparent';
    if (count === 0) return 'var(--paper-2)';
    const ratio = count / Math.max(1, dailyGoal);
    if (ratio >= 1.5) return 'var(--success)';
    if (ratio >= 1) return 'var(--accent)';
    if (ratio >= 0.5) return 'var(--accent-mid)';
    return 'var(--accent-soft)';
  }

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 8, alignItems: 'baseline', flexWrap: 'wrap', gap: 6,
      }}>
        <span style={{
          fontSize: '0.7rem', color: 'var(--ink-muted)',
          letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600,
        }}>
          Last {isMobile ? 14 : 24} weeks
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
          Less
          {['var(--paper-2)', 'var(--accent-soft)', 'var(--accent-mid)', 'var(--accent)', 'var(--success)'].map((c, i) => (
            <span key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c, border: '1px solid var(--border)' }} />
          ))}
          More
        </div>
      </div>

      <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
        {/* Month labels */}
        <div style={{ display: 'flex', gap, marginBottom: 4, paddingLeft: 0 }}>
          {weeks.map((_, i) => {
            const lbl = monthLabels.find(m => m.weekIndex === i);
            return (
              <div key={i} style={{ width: cell, fontSize: '0.65rem', color: 'var(--ink-faint)', letterSpacing: '-0.005em' }}>
                {lbl?.label || ''}
              </div>
            );
          })}
        </div>
        {/* Grid */}
        <div style={{ display: 'flex', gap }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
              {wk.map((d, di) => (
                <div
                  key={di}
                  onMouseEnter={e => setHovered({
                    x: e.clientX, y: e.clientY,
                    date: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count: d.count,
                  })}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: cell, height: cell, borderRadius: 3,
                    background: color(d.count, d.isFuture),
                    border: d.isFuture ? 'none' : '1px solid var(--border)',
                    cursor: 'default',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {hovered && (
          <div style={{
            position: 'fixed',
            left: hovered.x + 10,
            top: hovered.y - 32,
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '4px 8px',
            fontSize: '0.7rem',
            borderRadius: 6,
            pointerEvents: 'none',
            zIndex: Z.dropdown,
          }}>
            {hovered.count} applied · {hovered.date}
          </div>
        )}
      </div>
    </div>
  );
}
