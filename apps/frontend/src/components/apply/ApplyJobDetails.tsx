// FILE: src/components/apply/ApplyJobDetails.tsx
// The JD column: employer mark, job title, the one-line meta row, the assignment
// preview slot and the description.
//
// Split from ApplyFormClient for size (section 2). Not a client island — it holds
// no state and no handlers, so it renders wherever its parent does.

import CompanyLogoMark from '@/components/company/CompanyLogoMark';
import type { PublicCompany, PublicJob } from '@/types/public-apply';
import { formatSalaryLPA } from './apply-form-constants';

export default function ApplyJobDetails({ company, job, assignmentPreview }: {
  company: PublicCompany;
  job: PublicJob;
  assignmentPreview?: React.ReactNode;
}) {
  return (
    <div>
      {/* The employer's own mark, so the page reads as THEIR careers surface rather
          than a generic form. Falls back to initials when no logo is uploaded. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <CompanyLogoMark name={company.name} logoUrl={company.logoUrl} size={44} borderRadius={10} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{company.name}</p>
          {company.tagline && (
            <p style={{ margin: '1px 0 0', fontSize: '0.825rem', color: 'var(--ink-muted)' }}>{company.tagline}</p>
          )}
        </div>
      </div>
      <h1 className="font-display" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginTop: 4 }}>
        {[job.location, job.employmentType, formatSalaryLPA(job.salaryMin, job.salaryMax)].filter(Boolean).join(' · ')}
      </p>
      {/* ABOVE the description, deliberately. A take-home is the single largest
          cost a candidate is being asked to accept, and burying that disclosure
          under 500 words of job description means they commit to reading before
          they know what they are committing to. It goes directly under the
          header — title, company, location, salary — and before the JD.

          Still a Server Component: it arrives already rendered through the
          assignmentPreview slot and ships no markdown JavaScript to the browser.
          Moving it is a change of position, not of ownership. */}
      {assignmentPreview && <div style={{ marginTop: 16 }}>{assignmentPreview}</div>}
      <p className="apply-jd-description" style={{ fontSize: '0.875rem', color: 'var(--ink)', marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{job.description}</p>
    </div>
  );
}
