// FILE: src/components/seeker/pipeline-stages.ts
// Shared stage constants for the pipeline view.

export const STAGES = {
  applied: { label: 'Applied', bg: 'var(--accent-soft)', color: 'var(--accent)' },
  screening: { label: 'Screening', bg: 'var(--info-soft)', color: 'var(--info)' },
  interview: { label: 'Interview', bg: 'var(--status-purple-bg)', color: 'var(--cat-indigo)' },
  offer: { label: 'Offer', bg: 'var(--warning-soft)', color: 'var(--warning)' },
  accepted: { label: 'Accepted', bg: 'var(--success-soft)', color: 'var(--success)' },
  rejected: { label: 'Rejected', bg: 'var(--danger-soft)', color: 'var(--danger)' },
  ghosted: { label: 'Ghosted', bg: 'var(--paper-2)', color: 'var(--ink-faint)' },
} as const;

export const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'ghosted'] as const;
export type StageName = keyof typeof STAGES;
