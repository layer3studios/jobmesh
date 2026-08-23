'use client';
// FILE: src/components/seeker/FunnelChart.tsx
import { useEffect, useState } from 'react';
import { STAGES, STAGE_ORDER } from './PipelineCard';
import type { StageName } from './PipelineCard';
import { useViewport } from '@/hooks/shared/useViewport';

interface Props {
  stageCounts: Record<string, number>;
  totalApplied: number;
}

export default function FunnelChart({ stageCounts, totalApplied }: Props) {
  const [visible, setVisible] = useState(false);
  // 480 is narrower than any token breakpoint — this chart's bars stop fitting
  // before a phone stops being a phone. The threshold stays its own; only the
  // width now comes from the shared hook instead of a second resize listener.
  const NARROW_CHART_WIDTH = 480;
  const { width } = useViewport();
  const isMobile = width < NARROW_CHART_WIDTH;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (totalApplied === 0) {
    return (
      <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', padding: 30, textAlign: 'center' }}>
        Apply to some jobs to see your pipeline stats.
      </div>
    );
  }

  const max = Math.max(...STAGE_ORDER.map(s => stageCounts[s] || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {STAGE_ORDER.map((s: StageName, i) => {
        const count = stageCounts[s] || 0;
        const cfg = STAGES[s];
        const pct = Math.round((count / totalApplied) * 100);
        const isEmpty = count === 0;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: isMobile ? 64 : 88,
              fontSize: '0.78rem',
              color: isEmpty ? 'var(--ink-faint)' : 'var(--ink-2)',
              fontWeight: 500,
              textAlign: 'right',
              flexShrink: 0,
            }}>{cfg.label}</div>
            <div style={{
              flex: 1,
              height: 28,
              borderRadius: 8,
              position: 'relative',
              background: isEmpty ? 'transparent' : cfg.bg,
              border: isEmpty ? '1px dashed var(--border)' : 'none',
              overflow: 'hidden',
            }}>
              {!isEmpty && (
                <div style={{
                  height: '100%',
                  width: `${(count / max) * 100}%`,
                  background: cfg.color,
                  opacity: 0.6,
                  transform: visible ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s`,
                  borderRadius: 8,
                }} />
              )}
            </div>
            <div style={{
              width: 60,
              fontSize: '0.78rem',
              color: isEmpty ? 'var(--ink-faint)' : cfg.color,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
              flexShrink: 0,
            }}>
              {count} <span style={{ color: 'var(--ink-faint)', fontWeight: 500, fontSize: '0.72rem' }}>· {pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
