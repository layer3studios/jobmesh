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
      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>{label}</p>
      <div role="group" aria-label={label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                border: selected ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
                background: selected ? 'var(--accent)' : 'transparent',
                color: selected ? 'var(--text-on-accent)' : 'var(--ink)',
                fontWeight: selected ? 600 : 400,
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
