// FILE: src/components/employer/jobs/score-badge-helpers.ts
// The ONE score→colour mapping, shared by the Ranked table pill and the
// Pipeline card badge/avatar. Numeric ranges, boundary-inclusive at the top of
// each band (80 = strong, 79 = good, 20 = weak, 19 = poor). Also home to the
// initials + compact-duration helpers both surfaces need.

export interface ScoreBadgeStyle { background: string; color: string; label: string }

export function getScoreBadgeStyle(score: number | null): ScoreBadgeStyle {
  if (score == null) return { background: 'var(--surface-raised)', color: 'var(--ink-faint)', label: '—' };
  if (score >= 80) return { background: 'var(--success-soft)', color: 'var(--success)', label: 'strong' };
  if (score >= 60) return { background: 'var(--accent-soft)', color: 'var(--accent)', label: 'good' };
  if (score >= 40) return { background: 'var(--warning-soft)', color: 'var(--warning)', label: 'partial' };
  if (score >= 20) return { background: 'var(--status-danger-bg)', color: 'var(--cat-orange)', label: 'weak' };
  return { background: 'var(--danger-soft)', color: 'var(--danger)', label: 'poor' };
}

/** The usable numeric score, or null (missing / errored / unscored). */
export function usableScore(score: { score: number | null; processingError: string | null } | null): number | null {
  if (!score || score.processingError || score.score == null) return null;
  return score.score;
}

/** "Ashish Ranjan" → "AR"; "Priya" → "PR"; '' → "?". */
export function getInitials(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Compact age: "24d", "15h", "3m", "now". '—' for unparseable input. */
export function formatCompactDuration(isoDate: string | null | undefined, now: number = Date.now()): string {
  const then = new Date(isoDate ?? '').getTime();
  if (!Number.isFinite(then)) return '—';
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
