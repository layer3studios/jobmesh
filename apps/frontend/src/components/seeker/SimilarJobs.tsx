'use client';
// FILE: src/components/seeker/SimilarJobs.tsx
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { IJob } from '../../types';
import CompanyLogo from './CompanyLogo';
import { useSeeker } from '../../context/seeker/SeekerContext';
import { buildSkillsRegex } from './JobDetailPanel';

const cache = new Map<string, IJob[]>();

interface Props { jobId: string; onSelect: (job: IJob) => void; }

export default function SimilarJobs({ jobId, onSelect }: Props) {
  const { userSkills } = useSeeker();
  const cacheKey = `${jobId}::${userSkills.length}`;
  const [jobs, setJobs] = useState<IJob[]>(cache.get(cacheKey) || []);
  const [loading, setLoading] = useState(!cache.has(cacheKey));

  useEffect(() => {
    if (cache.has(cacheKey)) { setJobs(cache.get(cacheKey)!); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/seeker/jobs/similar/${encodeURIComponent(jobId)}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: IJob[]) => { if (!cancelled) { cache.set(cacheKey, data); setJobs(data); } })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [jobId, cacheKey]);

  if (loading) {
    return (
      <div style={{ marginTop: 24 }}>
        <p style={sectionLabel}>Similar roles</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) return null;

  const skillRe = buildSkillsRegex(userSkills);

  return (
    <div style={{ marginTop: 24 }}>
      <p style={sectionLabel}>Similar roles</p>
      <div style={{ display: 'grid', gap: 6 }}>
        {jobs.slice(0, 5).map(j => {
          const matchedSkills = skillRe ? Array.from(new Set((j.JobTitle + ' ' + (j.DescriptionPlain || '')).match(skillRe) || [])).slice(0, 3) : [];
          return (
            <button
              key={j._id}
              onClick={() => onSelect(j)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <CompanyLogo name={j.Company} url={j.ApplicationURL} size={30} borderRadius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{j.JobTitle}</div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{j.Company} · {j.Location}</div>
              </div>
              {matchedSkills.length > 0 && (
                <span style={{
                  fontSize: '0.68rem', padding: '2px 7px', borderRadius: 6,
                  background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600,
                  flexShrink: 0,
                }}>{matchedSkills.length} match</span>
              )}
              <ChevronRight size={14} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-faint)',
  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8,
};
