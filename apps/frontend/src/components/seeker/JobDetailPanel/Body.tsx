'use client';
// FILE: src/components/seeker/JobDetailPanel/Body.tsx
// Scrolling body: TECH STACK (mono chips), COMPENSATION (hairline block),
// the description, then similar roles. Sections are mono-labelled and
// separated by hairlines — no tinted blocks.
import { useState, useMemo, useEffect } from 'react';
import type { IJob } from '../../../types';
import SimilarJobs from '../SimilarJobs';
import { getAutoTags, stripHtmlText, BOILERPLATE_REGEX, sectionLabel, MONO } from './job-detail-helpers';

interface Props {
  job: IJob;
  mobileMode?: boolean;
  onSelectJob?: (job: IJob) => void;
}

function salaryText(job: IJob): string | null {
  if (job.SalaryInfo) return job.SalaryInfo;
  if (!job.SalaryMin) return null;
  return `${job.SalaryMin}${job.SalaryMax ? ` – ${job.SalaryMax}` : ''} ${job.SalaryCurrency || ''}`.trim();
}

export default function Body({ job, mobileMode, onSelectJob }: Props) {
  const [boilerplateOpen, setBoilerplateOpen] = useState(false);
  useEffect(() => { setBoilerplateOpen(false); }, [job._id]);

  const auto = getAutoTags(job);
  const html = useMemo(() => job.DescriptionCleaned || job.Description || '', [job]);
  const salary = salaryText(job);

  return (
    <div className="thin-scroll" style={{
      flex: 1, overflowY: 'auto',
      padding: mobileMode ? '16px 16px 80px' : '20px 24px 28px',
    }}>
      {auto.techStack && auto.techStack.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Tech stack</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {auto.techStack.slice(0, 12).map(t => (
              <span key={t} style={{
                fontFamily: MONO, fontSize: 12, padding: '4px 10px', borderRadius: 8,
                background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-2)',
              }}>{t}</span>
            ))}
          </div>
        </section>
      )}

      {salary && (
        <section style={{
          marginBottom: 20, padding: '14px 0',
          borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        }}>
          <p style={{ ...sectionLabel, marginBottom: 6 }}>Compensation</p>
          <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{salary}</p>
        </section>
      )}

      {html && (
        <>
          <p style={sectionLabel}>About the role</p>
          <div className="job-description-html" style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)' }}
            dangerouslySetInnerHTML={{ __html: html }} />
        </>
      )}

      {html && BOILERPLATE_REGEX.test(stripHtmlText(html)) && !boilerplateOpen && (
        <button className="jd-boilerplate-toggle" onClick={() => setBoilerplateOpen(true)}>
          Show benefits & EEO statement
        </button>
      )}

      {onSelectJob && <SimilarJobs jobId={job._id} onSelect={onSelectJob} />}
    </div>
  );
}
