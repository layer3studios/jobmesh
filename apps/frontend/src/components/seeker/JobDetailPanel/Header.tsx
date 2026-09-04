// FILE: src/components/seeker/JobDetailPanel/Header.tsx
// The detail panel's masthead: a mono "posted" line, the serif display title,
// company with logo tile, then a row of hairline meta pills.
import { MapPin } from 'lucide-react';
import type { IJob } from '../../../types';
import CompanyLogo from '../CompanyLogo';
import { getAutoTags, inferWorkplace, relTime, metaPill, MONO } from './job-detail-helpers';

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
      {rt && (
        <p style={{
          fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--ink-muted)', marginBottom: 10,
        }}>
          Posted {rt}
        </p>
      )}

      <h2 className="font-display" style={{
        fontSize: mobileMode ? 26 : 32, fontWeight: 400,
        color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.1,
      }}>{job.JobTitle}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <CompanyLogo name={job.Company} url={job.ApplicationURL} domain={domain} size={32} borderRadius={8} style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 500 }}>{job.Company}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        <span style={metaPill}><MapPin size={11} />{job.Location}</span>
        {wp && <span style={{ ...metaPill, color: 'var(--ink)', borderColor: 'var(--border-strong)' }}>{wp}</span>}
        {auto.roleCategory && <span style={metaPill}>{auto.roleCategory}</span>}
        {auto.experienceBand && <span style={metaPill}>{auto.experienceBand}</span>}
      </div>
    </>
  );
}
