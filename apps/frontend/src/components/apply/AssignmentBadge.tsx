// FILE: src/components/apply/AssignmentBadge.tsx
// The "this role has a take-home" pill. Server Component — pure presentation.
// Used on BOTH the company job list (size 'sm') and the job detail page
// (size 'md'), so the cost signal reads identically wherever a candidate meets it.
// Visual matches the tech-stack pills in seeker/JobDetailPanel/Body.tsx.

interface Props {
  estimatedHours: number;
  allowedFileTypes?: string[];
  size?: 'sm' | 'md';
}

const pillStyle = (size: 'sm' | 'md'): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: size === 'sm' ? '0.75rem' : '0.78rem',
  padding: size === 'sm' ? '2px 8px' : '3px 9px',
  borderRadius: 6,
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontWeight: 500,
});

/** "1 hr" reads wrong as "1 hrs", and "~1 hr" reads oddly precise. */
function formatHours(hours: number): string {
  return hours === 1 ? '1 hr' : `~${hours} hrs`;
}

export default function AssignmentBadge({ estimatedHours, allowedFileTypes = [], size = 'sm' }: Props) {
  // Empty allowedFileTypes is meaningful, not missing: the employer configured a
  // link-only submission, so say that rather than showing nothing.
  const formats = allowedFileTypes.length > 0
    ? `Accepts ${allowedFileTypes.map((type) => type.toUpperCase()).join(', ')}`
    : 'Link submission';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={pillStyle(size)}>{`Assignment · ${formatHours(estimatedHours)}`}</span>
      {size === 'md' && (
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{formats}</span>
      )}
    </span>
  );
}
