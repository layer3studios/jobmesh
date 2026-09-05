'use client';
// FILE: src/components/employer/jobs/PillToggle.tsx
// Shared one-of pill group: selected pill is filled accent, others outlined.
// Used by the posting form (workplace/employment) and reusable anywhere a
// small enum picker beats a dropdown.

export function PillToggleGroup({
  label, options, value, onChange, error,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{label}</p>
      <div role="group" aria-label={label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className="eb-pill"
              onClick={() => onChange(option.value)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                border: selected ? '1px solid var(--ink)' : '1px solid var(--border)',
                background: selected ? 'var(--ink)' : 'transparent',
                color: selected ? 'var(--paper)' : 'var(--ink-muted)',
                fontWeight: 500,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--danger)', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}
