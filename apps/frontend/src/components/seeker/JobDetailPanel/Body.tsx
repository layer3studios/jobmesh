'use client';
// FILE: src/components/seeker/JobDetailPanel/Body.tsx
import { useState, useMemo, useEffect } from 'react';
import type { IJob } from '../../../types';
import SimilarJobs from '../SimilarJobs';
import { getAutoTags, stripHtmlText, BOILERPLATE_REGEX, sectionLabel } from './job-detail-helpers';

interface Props {
  job: IJob;
  mobileMode?: boolean;
  onSelectJob?: (job: IJob) => void;
}

export default function Body({ job, mobileMode, onSelectJob }: Props) {
  const [boilerplateOpen, setBoilerplateOpen] = useState(false);
  useEffect(() => { setBoilerplateOpen(false); }, [job._id]);

  const auto = getAutoTags(job);
  const html = useMemo(() => job.DescriptionCleaned || job.Description || '', [job]);

  return (
    <div className="thin-scroll" style={{
      flex: 1, overflowY: 'auto',
      padding: mobileMode ? '16px 16px 80px' : '20px 22px',
    }}>
      {auto.techStack && auto.techStack.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <p style={sectionLabel}>Tech stack</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {auto.techStack.slice(0, 12).map(t => (
              <span key={t} style={{
                fontSize: '0.78rem', padding: '3px 9px', borderRadius: 6,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="job-description-html" dangerouslySetInnerHTML={{ __html: html }} />

      {html && BOILERPLATE_REGEX.test(stripHtmlText(html)) && !boilerplateOpen && (
        <button className="jd-boilerplate-toggle" onClick={() => setBoilerplateOpen(true)}>
          Show benefits & EEO statement
        </button>
      )}

      {(job.SalaryInfo || job.SalaryMin) && (
        <div style={{
          marginTop: 18, padding: '10px 14px',
          background: 'var(--success-soft)', color: 'var(--success)',
          borderRadius: 10, fontSize: '0.875rem', fontWeight: 500,
        }}>
          💰 {job.SalaryInfo || `${job.SalaryMin}${job.SalaryMax ? ` – ${job.SalaryMax}` : ''} ${job.SalaryCurrency || ''}`}
        </div>
      )}

      {onSelectJob && <SimilarJobs jobId={job._id} onSelect={onSelectJob} />}
    </div>
  );
}
