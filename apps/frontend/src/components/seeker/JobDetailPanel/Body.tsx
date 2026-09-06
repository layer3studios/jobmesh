'use client';
// FILE: src/components/seeker/JobDetailPanel/Body.tsx
// Scrolling body: the Overview table, the tech stack (chips the seeker
// already has are marked), then the description as structured prose, then
// similar roles. While a row's full document is still on its way, the
// description slot shows a skeleton of itself — never a spinner.
import { useState, useMemo, useEffect } from 'react';
import type { IJob } from '../../../types';
import SimilarJobs from '../SimilarJobs';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { getAutoTags, stripHtmlText, BOILERPLATE_REGEX } from './job-detail-helpers';
import Overview from './Overview';

interface Props {
  job: IJob;
  mobileMode?: boolean;
  onSelectJob?: (job: IJob) => void;
}

export default function Body({ job, mobileMode, onSelectJob }: Props) {
  const [boilerplateOpen, setBoilerplateOpen] = useState(false);
  useEffect(() => { setBoilerplateOpen(false); }, [job._id]);
  const { userSkills } = useSeeker();
  const mine = useMemo(() => new Set(userSkills.map(s => s.toLowerCase())), [userSkills]);

  const auto = getAutoTags(job);
  const html = useMemo(() => job.DescriptionCleaned || job.Description || '', [job]);
  // Feed rows arrive without a body; the orchestrator tops them up by id.
  const bodyPending = job.Description === undefined && !job.DescriptionCleaned;

  return (
    <div className={`jb-detail__scroll${mobileMode ? '' : ' panel-scroll'}`}>
      <Overview job={job} />

      {auto.techStack && auto.techStack.length > 0 && (
        <section className="jb-section">
          <p className="jb-section__label">Tech stack</p>
          <div className="jb-stack">
            {auto.techStack.slice(0, 14).map(t => (
              <span key={t} className={`jb-stack__chip${mine.has(t.toLowerCase()) ? ' jb-stack__chip--mine' : ''}`} title={mine.has(t.toLowerCase()) ? 'On your profile' : undefined}>
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="jb-section">
        <p className="jb-section__label">About the role</p>
        {bodyPending ? (
          <div aria-busy="true" aria-label="Loading description" style={{ display: 'grid', gap: 10 }}>
            <div className="skeleton" style={{ height: 14, width: '92%' }} />
            <div className="skeleton" style={{ height: 14, width: '98%' }} />
            <div className="skeleton" style={{ height: 14, width: '85%' }} />
            <div className="skeleton" style={{ height: 14, width: '40%', marginTop: 10 }} />
            <div className="skeleton" style={{ height: 14, width: '90%' }} />
            <div className="skeleton" style={{ height: 14, width: '76%' }} />
          </div>
        ) : html ? (
          <div className="jd-prose" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="jb-detail__empty" style={{ padding: '18px 0', textAlign: 'left' }}>
            This listing didn’t include a description. The full posting is on the company’s site — use Apply above.
          </p>
        )}
        {html && !bodyPending && BOILERPLATE_REGEX.test(stripHtmlText(html)) && !boilerplateOpen && (
          <button className="jd-boilerplate-toggle press" onClick={() => setBoilerplateOpen(true)}>
            Show benefits & EEO statement
          </button>
        )}
      </section>

      {onSelectJob && <SimilarJobs jobId={job._id} onSelect={onSelectJob} />}
    </div>
  );
}
