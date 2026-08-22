// FILE: src/components/seeker/profile/ProfileReadonly.tsx
// Read-only profile sections for MVP (D5): work experience + education. Editing
// structured arrays inline is deferred to a later step; these render only.

import { Card, Badge, Stack } from '../../ui';
import type { ParsedProfile } from '../../../types/seeker-profile';

function dateRange(start: string | null, end: string | null, isCurrent: boolean) {
  const to = isCurrent ? 'Present' : (end || '');
  return [start, to].filter(Boolean).join(' – ');
}

export function ProfileExperience({ profile }: { profile: ParsedProfile }) {
  if (profile.experience.length === 0) return null;
  return (
    <Card>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Work experience</h3>
      <Stack gap={14}>
        {profile.experience.map((e, i) => (
          <div key={`${e.company}-${i}`}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>{e.title || 'Role'}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
              {[e.company, dateRange(e.startDate, e.endDate, e.isCurrent)].filter(Boolean).join(' · ')}
            </p>
            {e.responsibilities.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--ink-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {e.responsibilities.slice(0, 5).map((r, ri) => <li key={ri}>{r}</li>)}
              </ul>
            )}
            {e.technologies.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <Stack gap={6} dir="row" wrap>
                  {e.technologies.map((t) => <Badge key={t} variant="neutral">{t}</Badge>)}
                </Stack>
              </div>
            )}
          </div>
        ))}
      </Stack>
    </Card>
  );
}

export function ProfileEducation({ profile }: { profile: ParsedProfile }) {
  if (profile.education.length === 0) return null;
  return (
    <Card>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Education</h3>
      <Stack gap={12}>
        {profile.education.map((e, i) => (
          <div key={`${e.institution}-${i}`}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>{e.institution || 'Institution'}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
              {[[e.degree, e.field].filter(Boolean).join(', '), dateRange(e.startDate, e.endDate, false)].filter(Boolean).join(' · ')}
            </p>
            <Stack gap={6} dir="row" wrap>
              {e.collegeTier && <Badge variant="brand">{e.collegeTier}</Badge>}
              {e.cgpa != null && <Badge variant="neutral">CGPA {e.cgpa}</Badge>}
              {e.percentage != null && <Badge variant="neutral">{e.percentage}%</Badge>}
            </Stack>
          </div>
        ))}
      </Stack>
    </Card>
  );
}
