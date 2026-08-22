// FILE: src/app/(admin)/admin/analytics/parts/KpiTile.tsx
// A single big-number tile. Server-safe (no client hooks). `value` is pre-formatted
// by the caller when it needs grouping; a raw number is formatted with locale commas.
interface Props {
  label: string;
  value: number | string;
  hint?: string;
}

export default function KpiTile({ label, value, hint }: Props) {
  const display = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '12px 14px', minWidth: 0,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1.1 }}>
        {display}
      </div>
      {hint && <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
