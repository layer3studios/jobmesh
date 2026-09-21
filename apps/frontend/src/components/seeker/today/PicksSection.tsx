'use client';
// FILE: src/components/seeker/today/PicksSection.tsx
// Four roles that match the seeker's skills, set as a numbered editorial list:
// hairline rows, the title in the serif, the facts in mono. Selecting one
// opens it on /jobs with the detail pane already on it.
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { IJob } from '../../../types';
import { Button } from '../../ui';
import CompanyLogo from '../CompanyLogo';
import { getAutoTags, relTime } from '../JobDetailPanel';
import { EdSection } from './shared';

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
    <EdSection
      id="picks"
      number="01"
      kicker={userSkillsLength > 0 ? `Picks for you · ${userSkillsLength} skills` : 'Picks for you'}
      title="Four roles worth a look"
      link={{ label: 'All roles', to: '/jobs' }}
    >
      {userSkillsLength === 0 && (
        <p className="ed__note rise">
          These get personal once we know what you work with.
          <button type="button" className="ed__note-btn press press--sm" onClick={onOpenSkillsEditor}>Add your skills</button>
        </p>
      )}

      {loading ? (
        <ol className="pk" aria-busy="true" aria-label="Loading picks">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="pk__row pk__row--skel" style={{ opacity: 1 - i * 0.18 }}>
              <span className="pk__num skeleton" />
              <span className="skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
              <span style={{ display: 'grid', gap: 8 }}>
                <span className="skeleton" style={{ height: 18, width: `${52 + (i * 13) % 30}%` }} />
                <span className="skeleton" style={{ height: 11, width: `${30 + (i * 9) % 20}%` }} />
              </span>
            </li>
          ))}
        </ol>
      ) : error ? (
        <div className="jb-error rise td-error" role="alert">
          <p className="jb-error__title">Picks are taking a moment</p>
          <p className="jb-error__body">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetry} iconLeft={<RefreshCw size={13} />}>Try again</Button>
        </div>
      ) : picks.length === 0 ? (
        <p className="ed__empty">No roles right now. Check back in a few hours.</p>
      ) : (
        <ol className="pk">
          {picks.map((j, i) => {
            const auto = getAutoTags(j);
            const matched = skillRe
              ? Array.from(new Set((`${j.JobTitle} ${j.DescriptionPlain || ''} ${(auto.techStack || []).join(' ')}`).match(skillRe) || [])).length
              : 0;
            const pct = userSkillsLength > 0 ? Math.round((matched / userSkillsLength) * 100) : 0;
            const rt = relTime(j.PostedDate || j.createdAt || j.scrapedAt || null);
            const applied = appliedJobIds.has(j._id);
            const tags = (auto.techStack || []).slice(0, 3);
            const go = () => router.push(`/jobs?selectedJob=${encodeURIComponent(j._id)}`);
            return (
              <li key={j._id} className="rise" style={{ '--i': i } as React.CSSProperties}>
                <button type="button" className="pk__row" onClick={go} data-applied={applied ? 'true' : 'false'}>
                  <span className="pk__num">{String(i + 1).padStart(2, '0')}</span>
                  <CompanyLogo name={j.Company} url={j.ApplicationURL} size={36} borderRadius={9} />
                  <span className="pk__main">
                    <span className="font-display pk__title">{j.JobTitle}</span>
                    <span className="pk__meta">
                      <span className="pk__co">{j.Company}</span>
                      <span className="pk__dot" aria-hidden>·</span>
                      <span>{j.Location}</span>
                      {rt && <><span className="pk__dot" aria-hidden>·</span><span>{rt}</span></>}
                      {matched > 0 && <><span className="pk__dot" aria-hidden>·</span><span className="pk__match">{pct}% match</span></>}
                      {applied && <><span className="pk__dot" aria-hidden>·</span><span className="pk__applied">Applied</span></>}
                    </span>
                    {tags.length > 0 && <span className="pk__tags">{tags.join('  /  ')}</span>}
                  </span>
                  <span className="pk__arrow" aria-hidden><ArrowUpRight size={16} /></span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </EdSection>
  );
}
