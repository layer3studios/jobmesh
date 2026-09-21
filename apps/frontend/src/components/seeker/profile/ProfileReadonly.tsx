// FILE: src/components/seeker/profile/ProfileReadonly.tsx
// Work experience and education as a timeline — mono dates on the left,
// role and company on the right, the way Read.cv lays a career out. They
// come from the resume; the empty state says how to add them.
import Link from 'next/link';
import { Upload } from 'lucide-react';
import type { ParsedProfile } from '../../../types/seeker-profile';

function dateRange(start: string | null, end: string | null, isCurrent: boolean) {
  const to = isCurrent ? 'Present' : (end || '');
  return [start, to].filter(Boolean).join(' – ');
}

function Empty({ what }: { what: string }) {
  return (
    <div className="pf-empty rise">
      <p className="pf-empty__title">No {what} yet</p>
      <p className="pf-empty__body">It comes straight from your resume. Upload a newer one and this fills itself in.</p>
      <Link href="/resume" className="ui-btn pf-empty__cta"><Upload size={13} /> Upload resume</Link>
    </div>
  );
}

export function ProfileExperience({ profile }: { profile: ParsedProfile }) {
  if (profile.experience.length === 0) return <Empty what="experience" />;
  return (
    <div className="pf-timeline pf-timeline--full">
      {profile.experience.map((e, i) => (
        <div key={`${e.company}-${i}`} className="pf-tl rise" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
          <div className="pf-tl__when">{dateRange(e.startDate, e.endDate, e.isCurrent)}{e.isCurrent && <span className="pf-tl__now">Now</span>}</div>
          <div>
            <div className="pf-tl__what">{e.title || 'Role'}</div>
            <div className="pf-tl__where">{e.company}</div>
            {e.responsibilities.length > 0 && (
              <ul className="pf-tl__list">{e.responsibilities.slice(0, 5).map((r, ri) => <li key={ri}>{r}</li>)}</ul>
            )}
            {e.technologies.length > 0 && (
              <div className="pf-chips" style={{ marginTop: 8 }}>{e.technologies.map(t => <span key={t} className="pf-chip">{t}</span>)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileEducation({ profile }: { profile: ParsedProfile }) {
  if (profile.education.length === 0) return <Empty what="education" />;
  return (
    <div className="pf-timeline pf-timeline--full">
      {profile.education.map((e, i) => (
        <div key={`${e.institution}-${i}`} className="pf-tl rise" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
          <div className="pf-tl__when">{dateRange(e.startDate, e.endDate, false)}</div>
          <div>
            <div className="pf-tl__what">{e.institution || 'Institution'}</div>
            <div className="pf-tl__where">{[e.degree, e.field].filter(Boolean).join(', ')}</div>
            <div className="pf-chips" style={{ marginTop: 8 }}>
              {e.collegeTier && <span className="pf-chip pf-chip--ink">{e.collegeTier}</span>}
              {e.cgpa != null && <span className="pf-chip">CGPA {e.cgpa}</span>}
              {e.percentage != null && <span className="pf-chip">{e.percentage}%</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
