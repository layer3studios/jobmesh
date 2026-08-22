'use client';
// FILE: src/app/(admin)/admin/analytics/parts/FunnelBarChart.tsx
// Horizontal bar chart of funnel stage counts (recharts BarChart, vertical layout).
// Stage labels sit on the Y axis; the frontend does not compute drop-off here — the
// visual descent tells the story, exact numbers live in the KPI tiles above.
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { FunnelStage } from '@/types/admin-analytics';

// Prettify a snake_case event stage into a human label.
function label(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FunnelBarChart({ title, stages }: { title: string; stages: FunnelStage[] }) {
  const data = stages.map((s) => ({ name: label(s.stage), count: s.count }));
  const height = Math.max(120, data.length * 44);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--paper-2)' }}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.78rem' }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill="var(--accent)" fillOpacity={1 - index * (0.6 / Math.max(1, data.length))} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
