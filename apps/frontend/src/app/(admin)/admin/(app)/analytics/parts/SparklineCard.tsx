'use client';
// FILE: src/app/(admin)/admin/analytics/parts/SparklineCard.tsx
// Small line-chart tile for a daily time series (recharts LineChart). Minimal chrome:
// a title, the latest total, and a compact sparkline. No axes labels — this is a trend
// cue, not a precise plot.
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis } from 'recharts';
import type { DailyCount } from '@/types/admin-analytics';

export default function SparklineCard({ title, data }: { title: string; data: DailyCount[] }) {
  const total = data.reduce((sum, point) => sum + point.count, 0);
  return (
    <div style={{
      background: 'var(--glass-card)', backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-sat))', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-sat))', boxShadow: 'inset 0 1px 0 var(--glass-sheen), var(--shadow-sm)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          {title}
        </span>
        <span style={{ fontFamily: 'var(--font-instrument-serif), var(--font-source-serif), Georgia, serif', fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>{total.toLocaleString()}</span>
      </div>
      <div style={{ height: 64 }}>
        {data.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', paddingTop: 20 }}>No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <XAxis dataKey="date" hide />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={{ background: 'var(--glass-card)', backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-sat))', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-sat))', boxShadow: 'inset 0 1px 0 var(--glass-sheen), var(--shadow-sm)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.78rem' }}
                labelStyle={{ color: 'var(--ink-muted)' }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--thread-indigo)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
