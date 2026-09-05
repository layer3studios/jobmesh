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
      background: 'var(--glass-card)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '12px 14px', minWidth: 0,
    }}>
      <div style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-instrument-serif), var(--font-source-serif), Georgia, serif', fontSize: 30, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--ink)', marginTop: 6, lineHeight: 1 }}>
        {display}
      </div>
      {hint && <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
