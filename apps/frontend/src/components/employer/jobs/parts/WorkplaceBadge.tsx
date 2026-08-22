// FILE: src/components/employer/jobs/parts/WorkplaceBadge.tsx
// Workplace type as a semantic pill. Remote/Hybrid/On-site are a small closed set
// an employer scans down a column, and three tinted pills are read at a glance
// where three words are read one at a time.
//
// The tints are hue-coded but NEVER carry meaning on their own — the label is
// always present, so a colour-blind reader loses nothing.

import type { WorkplaceType } from '@/types/employer-jobs';

const STYLE_BY_TYPE: Record<WorkplaceType, { background: string; color: string; label: string }> = {
  remote: { background: 'var(--success-soft)', color: 'var(--success)', label: 'Remote' },
  hybrid: { background: 'var(--info-soft)', color: 'var(--info)', label: 'Hybrid' },
  onsite: { background: 'var(--paper-2)', color: 'var(--ink-2)', label: 'On-site' },
};

export function WorkplaceBadge({ workplaceType }: { workplaceType: WorkplaceType | null | undefined }) {
  const style = workplaceType ? STYLE_BY_TYPE[workplaceType] : undefined;
  // Older rows can carry a value outside the set. Falling back to the raw string
  // beats rendering nothing where a column is expected.
  if (!style) {
    return workplaceType
      ? <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{workplaceType}</span>
      : null;
  }
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
      display: 'inline-block', lineHeight: 1.5,
      background: style.background, color: style.color,
    }}>
      {style.label}
    </span>
  );
}
