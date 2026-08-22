// FILE: src/components/seeker/JobDetailPanel/Header.tsx
import { MapPin, Clock } from 'lucide-react';
import type { IJob } from '../../../types';
import CompanyLogo from '../CompanyLogo';
import { getAutoTags, inferWorkplace, relTime, roleBadgeStyle, metaPill } from './job-detail-helpers';

interface Props {
  job: IJob;
  domain?: string;
  mobileMode?: boolean;
}

export default function Header({ job, domain, mobileMode }: Props) {
  const auto = getAutoTags(job);
  const wp = inferWorkplace(job);
  const rt = relTime(job.PostedDate || job.createdAt || job.scrapedAt || null);

  return (
    <>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <CompanyLogo
          name={job.Company}
          url={job.ApplicationURL}
          domain={domain}
          size={48}
          borderRadius={11}
          style={{ flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontSize: mobileMode ? '1.05rem' : '1.2rem',
            fontWeight: 600, color: 'var(--ink)',
            letterSpacing: '-0.018em', lineHeight: 1.25,
          }}>{job.JobTitle}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 4 }}>{job.Company}</p>
        </div>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 12,
      }}>
        <span style={metaPill}><MapPin size={11} />{job.Location}</span>
        {wp && <span style={{ ...metaPill, background: 'var(--info-soft)', color: 'var(--info)' }}>{wp}</span>}
        {rt && <span style={metaPill}><Clock size={11} />{rt}</span>}
        {auto.roleCategory && (
          <span style={{ ...metaPill, ...roleBadgeStyle(auto.roleCategory) }}>{auto.roleCategory}</span>
        )}
        {auto.experienceBand && <span style={metaPill}>{auto.experienceBand}</span>}
      </div>
    </>
  );
}
