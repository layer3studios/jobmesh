// FILE: src/components/seeker/JobDetailPanel/Header.tsx
// The detail pane's masthead: a mono eyebrow (posted · new), the serif title,
// and the company with its logo tile. The facts live in the Overview table
// (Body), not here — the masthead says what and who, the table says where,
// how much and when.
import type { IJob } from '../../../types';
import CompanyLogo from '../CompanyLogo';
import { getAutoTags, relTime } from './job-detail-helpers';

interface Props {
  job: IJob;
  domain?: string;
  mobileMode?: boolean;
}

export default function Header({ job, domain }: Props) {
  const auto = getAutoTags(job);
  const rt = relTime(job.PostedDate || job.createdAt || job.scrapedAt || null);
  const isNew = rt === 'Today' || rt === '1d ago';

  return (
    <>
      <p className="jb-detail__eyebrow">
        {rt && <span>Posted {rt}</span>}
        {isNew && <span className="jb-tag jb-tag--ink">New</span>}
        {auto.urgency === 'Urgent' && <span className="jb-tag" style={{ color: 'var(--danger)', borderColor: 'transparent', background: 'var(--danger-soft)' }}>Urgent</span>}
      </p>

      <h2 className="font-display jb-detail__title">{job.JobTitle}</h2>

      <div className="jb-detail__company">
        <CompanyLogo name={job.Company} url={job.ApplicationURL} domain={domain} size={32} borderRadius={8} style={{ flexShrink: 0 }} />
        <span>{job.Company}</span>
      </div>
    </>
  );
}
