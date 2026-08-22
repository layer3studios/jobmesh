'use client';
// FILE: src/components/seeker/PipelineCard.tsx
import { useState, useEffect } from 'react';
import { ExternalLink, Clock, MoreHorizontal } from 'lucide-react';
import { STAGES, STAGE_ORDER, type StageName } from './pipeline-stages';
import { Z } from '@/theme/tokens';

// Re-export for back-compat (other files import these from PipelineCard)
export { STAGES, STAGE_ORDER };
export type { StageName };

interface PipelineCardProps {
  jobId: string;
  jobTitle: string;
  company: string;
  location: string | null;
  department: string | null;
  applicationURL: string | null;
  stage: string;
  stageUpdatedAt: string;
  appliedAt: string;
  isListingActive: boolean;
  onStageChange: (jobId: string, newStage: string) => void;
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return days + 'd ago';
  if (days < 14) return '1w ago';
  if (days < 30) return Math.floor(days / 7) + 'w ago';
  return Math.floor(days / 30) + 'mo ago';
}

export default function PipelineCard({
  jobId, jobTitle, company, location, department,
  applicationURL, stage, stageUpdatedAt, appliedAt, isListingActive, onStageChange,
}: PipelineCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const stageKey = (STAGES[stage as StageName] ? stage : 'applied') as StageName;
  const cfg = STAGES[stageKey];

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 11,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? 10 : 14,
      position: 'relative',
    }}>
      <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--ink)',
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
        }}>{jobTitle}</div>
        <div style={{
          fontSize: '0.76rem',
          color: 'var(--ink-muted)',
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          <span>{company}</span>
          {location && <><span style={{ color: 'var(--ink-faint)' }}>·</span><span>{location}</span></>}
          {department && <><span style={{ color: 'var(--ink-faint)' }}>·</span><span>{department}</span></>}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'space-between' : 'flex-end',
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 999,
              border: '1px solid transparent',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: cfg.bg,
              color: cfg.color,
              cursor: 'pointer',
            }}
          >
            {cfg.label}
            <MoreHorizontal size={11} />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              style={{
                position: 'absolute',
                top: 'calc(100% + 5px)',
                right: 0,
                minWidth: 130,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-md)',
                padding: 4,
                zIndex: Z.card,
              }}
            >
              {STAGE_ORDER.map(s => (
                <button
                  key={s}
                  onClick={() => { onStageChange(jobId, s); setMenuOpen(false); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 9px',
                    borderRadius: 7,
                    border: 'none',
                    background: s === stageKey ? 'var(--paper-2)' : 'transparent',
                    color: STAGES[s].color,
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGES[s].color }} />
                  {STAGES[s].label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span style={{
          fontSize: '0.7rem',
          color: 'var(--ink-faint)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}>
          <Clock size={10} /> {relativeTime(stageUpdatedAt || appliedAt)}
        </span>

        {applicationURL && (
          <a
            href={applicationURL}
            target="_blank"
            rel="noopener noreferrer"
            title={isListingActive ? 'Open posting' : 'Posting may be closed'}
            style={{
              width: 26, height: 26, borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-muted)',
              flexShrink: 0,
              opacity: isListingActive ? 1 : 0.5,
            }}
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}
