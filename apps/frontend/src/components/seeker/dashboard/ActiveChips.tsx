'use client';
// FILE: src/components/seeker/dashboard/ActiveChips.tsx

interface Chip { label: string; clear: () => void; }

interface Props {
  filters: Chip[];
  onClearAll: () => void;
}

export default function ActiveChips({ filters, onClearAll }: Props) {
  if (filters.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {filters.map((f, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 6px 4px 11px', borderRadius: 999,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          fontSize: '0.78rem', fontWeight: 500,
        }}>
          {f.label}
          <button onClick={f.clear} style={{
            width: 16, height: 16, borderRadius: 999,
            border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer',
            color: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}>×</button>
        </span>
      ))}
      <button onClick={onClearAll} style={{
        fontSize: '0.78rem', color: 'var(--ink-muted)',
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '4px 8px', textDecoration: 'underline',
      }}>Clear all</button>
    </div>
  );
}
