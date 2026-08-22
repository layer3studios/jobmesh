'use client';
// FILE: src/app/(admin)/admin/analytics/parts/PieDistribution.tsx
// Donut chart with a legend for a small categorical distribution (recharts PieChart).
// Used for traffic-by-referrer and traffic-by-device.
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface Slice { name: string; value: number }

// A small, theme-neutral categorical palette (distinct hues, readable in both themes).
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#94a3b8'];

export default function PieDistribution({ title, data }: { title: string; data: Slice[] }) {
  const nonEmpty = data.filter((d) => d.value > 0);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
      {nonEmpty.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={nonEmpty} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
              {nonEmpty.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.78rem' }}
            />
            <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
