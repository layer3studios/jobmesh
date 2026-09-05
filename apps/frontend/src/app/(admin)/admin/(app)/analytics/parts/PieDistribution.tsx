'use client';
// FILE: src/app/(admin)/admin/analytics/parts/PieDistribution.tsx
// Donut chart with a legend for a small categorical distribution (recharts PieChart).
// Used for traffic-by-referrer and traffic-by-device.
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface Slice { name: string; value: number }

// A small, theme-neutral categorical palette (distinct hues, readable in both themes).
// Categorical series — the theme's --cat-* palette, so charts follow dark/light.
const COLORS = ['var(--cat-indigo)', 'var(--cat-green)', 'var(--cat-amber)', 'var(--cat-red)', 'var(--cat-blue)', 'var(--cat-purple)', 'var(--ink-faint)'];

export default function PieDistribution({ title, data }: { title: string; data: Slice[] }) {
  const nonEmpty = data.filter((d) => d.value > 0);
  return (
    <div style={{ background: 'var(--glass-card)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
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
              contentStyle={{ background: 'var(--glass-card)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.78rem' }}
            />
            <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
