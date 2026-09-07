'use client';
// FILE: src/components/seeker/today/PicksSection.tsx
// Four roles that match the seeker's skills, as the same rows the board uses.
// Selecting one opens it on /jobs with the detail pane already on it.
import { Sparkles, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { IJob } from '../../../types';
import JobListItem from '../JobListItem';
import { Button } from '../../ui';
import { getAutoTags, relTime } from '../JobDetailPanel';
import { compactJobBadges } from '../dashboard/job-badges';
import { ListSkeleton } from '../dashboard/DashboardBody';
import { Section } from './shared';

interface Props {
  picks: IJob[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  userSkillsLength: number;
  skillRe: RegExp | null;
  appliedJobIds: Set<string>;
  onOpenSkillsEditor: () => void;
}

export default function PicksSection({ picks, loading, error, onRetry, userSkillsLength, skillRe, appliedJobIds, onOpenSkillsEditor }: Props) {
  const router = useRouter();
  return (
    <Section
      label={userSkillsLength > 0 ? `Picks for you · ${userSkillsLength} skills` : 'Picks for you'}
      sub="Roles that match what you know, freshest first."
      linkLabel="All roles" linkTo="/jobs"
      className="td-picks"
    >
      {userSkillsLength === 0 && (
        <div className="td-nudge rise">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} /> Add your skills and these picks get personal.
          </span>
          <Button size="sm" onClick={onOpenSkillsEditor}>Add skills</Button>
        </div>
      )}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <div className="jb-error rise td-error" role="alert">
          <p className="jb-error__title">Picks are taking a moment</p>
          <p className="jb-error__body">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetry} iconLeft={<RefreshCw size={13} />}>Try again</Button>
        </div>
      ) : picks.length === 0 ? (
        <p style={{ color: 'var(--ink-muted)', fontSize: 13.5, padding: 16, textAlign: 'center' }}>No roles right now — check back in a few hours.</p>
      ) : (
        <div className="jb-list">
          {picks.map((j, i) => {
            const auto = getAutoTags(j);
            const matched = skillRe
              ? Array.from(new Set((`${j.JobTitle} ${j.DescriptionPlain || ''} ${(auto.techStack || []).join(' ')}`).match(skillRe) || [])).length
              : 0;
            const pct = userSkillsLength > 0 ? Math.round((matched / userSkillsLength) * 100) : 0;
            const rt = relTime(j.PostedDate || j.createdAt || j.scrapedAt || null);
            return (
              <div key={j._id} className="rise" style={{ '--i': i } as React.CSSProperties}>
                <JobListItem
                  job={j}
                  isSelected={false}
                  isApplied={appliedJobIds.has(j._id)}
                  isComeBack={false}
                  comeBackNote=""
                  isNew={rt === 'Today' || rt === '1d ago'}
                  relativeTime={rt}
                  visibleBadges={compactJobBadges(j)}
                  showSkillMatch={matched > 0}
                  skillMatchText={`${pct}% match`}
                  skillMatchBg="var(--accent-soft)"
                  skillMatchColor="var(--accent)"
                  onSelect={job => router.push(`/jobs?selectedJob=${encodeURIComponent(job._id)}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
