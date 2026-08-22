// FILE: src/components/seeker/dashboard/job-badges.ts
import type { IJob } from '../../../types';
import type { CompactBadge } from '../JobListItem';
import { getAutoTags, roleBadgeStyle } from '../JobDetailPanel';

/** Build the small set of badges shown on each job card in the list. */
export function compactJobBadges(job: IJob): CompactBadge[] {
  const auto = getAutoTags(job);
  const badges: CompactBadge[] = [];
  if (auto.urgency === 'Urgent') badges.push({ key: 'urgent', label: 'Urgent', bg: 'var(--danger-soft)', color: 'var(--danger)' });
  if (auto.roleCategory) {
    const tone = roleBadgeStyle(auto.roleCategory);
    badges.push({ key: 'role', label: auto.roleCategory, bg: tone.bg, color: tone.color });
  }
  if (auto.experienceBand) badges.push({ key: 'exp', label: auto.experienceBand, bg: 'var(--paper-2)', color: 'var(--ink-muted)' });
  if (auto.isEntryLevel) badges.push({ key: 'entry', label: 'Fresher', bg: 'var(--success-soft)', color: 'var(--success)' });
  for (const tech of (auto.techStack || []).slice(0, 2)) {
    badges.push({ key: `tech-${tech}`, label: tech, bg: 'var(--paper-2)', color: 'var(--ink-faint)' });
  }
  return badges.slice(0, 4);
}
