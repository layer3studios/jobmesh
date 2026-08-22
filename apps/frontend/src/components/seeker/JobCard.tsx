'use client';
// FILE: src/components/seeker/JobCard.tsx
import { useEffect, useState } from 'react';
import { MapPin, Clock, ArrowUpRight } from 'lucide-react';
import type { IJob } from '../../types';
import CompanyLogo from './CompanyLogo';

interface Props {
  job: IJob;
  domain?: string;
}

function relTime(d: string | null) {
  if (!d) return null;
  const posted = new Date(d);
  if (isNaN(posted.getTime())) return null;
  const diff = Math.floor((Date.now() - posted.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function salaryDisplay(job: IJob): string | null {
  if (job.SalaryInfo) return job.SalaryInfo;
  if (job.SalaryMin && job.SalaryMax) {
    const fmt = (n: number) =>
      (job.SalaryCurrency === 'INR' || !job.SalaryCurrency) && n >= 100000
        ? `${(n / 100000).toFixed(1)}L`
        : `${(n / 1000).toFixed(0)}K`;
    const curr =
      job.SalaryCurrency === 'INR' ? '₹' :
      job.SalaryCurrency === 'USD' ? '$' :
      (job.SalaryCurrency ? job.SalaryCurrency + ' ' : '');
    return `${curr}${fmt(job.SalaryMin)} – ${curr}${fmt(job.SalaryMax)}`;
  }
  return null;
}

function workplaceLabel(job: IJob): string | null {
  const wt = (job.WorkplaceType ?? '').toLowerCase();
  if (wt === 'remote' || job.IsRemote) return 'Remote';
  if (wt === 'hybrid') return 'Hybrid';
  if (wt === 'on-site' || wt === 'onsite') return 'On-site';
  return null;
}

export default function JobCard({ job, domain }: Props) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const effectiveDate = job.PostedDate || job.createdAt || job.scrapedAt || null;
  const rt = relTime(effectiveDate);
  const wp = workplaceLabel(job);
  const sal = salaryDisplay(job);

  return (
    <a
      href={job.DirectApplyURL || job.ApplicationURL}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: hovered ? 'var(--surface)' : 'var(--paper)',
        border: '1px solid',
        borderColor: hovered ? 'var(--border-strong)' : 'var(--border)',
        borderRadius: 12,
        padding: isMobile ? '14px' : '16px 18px',
        transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', gap: isMobile ? 12 : 14, alignItems: 'flex-start' }}>
        <CompanyLogo
          name={job.Company}
          url={job.ApplicationURL}
          domain={domain}
          size={42}
          borderRadius={10}
          style={{ flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.3,
              letterSpacing: '-0.012em',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {job.JobTitle}
            </h3>
            <ArrowUpRight
              size={14}
              style={{
                color: hovered ? 'var(--accent)' : 'var(--ink-faint)',
                flexShrink: 0,
                marginTop: 2,
                transition: 'color 160ms ease',
              }}
            />
          </div>

          {/* Company + location */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.82rem', color: 'var(--ink-muted)',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{job.Company}</span>
            <span style={{ color: 'var(--ink-faint)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} /> {job.Location}
            </span>
            {rt && (
              <>
                <span style={{ color: 'var(--ink-faint)' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {rt}
                </span>
              </>
            )}
          </div>

          {/* Badges */}
          {(wp || sal || job.ContractType) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {wp && (
                <span style={chipStyle('var(--info-soft)', 'var(--info)')}>
                  {wp}
                </span>
              )}
              {sal && (
                <span style={chipStyle('var(--success-soft)', 'var(--success)')}>
                  {sal}
                </span>
              )}
              {job.ContractType && job.ContractType !== 'N/A' && (
                <span style={chipStyle('var(--paper-2)', 'var(--ink-muted)')}>
                  {job.ContractType}
                </span>
              )}
              {job.Department && job.Department !== 'N/A' && job.Department !== '' && (
                <span style={chipStyle('var(--paper-2)', 'var(--ink-muted)')}>
                  {job.Department}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function chipStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 8px',
    borderRadius: 6,
    background: bg,
    color,
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '-0.005em',
  };
}
