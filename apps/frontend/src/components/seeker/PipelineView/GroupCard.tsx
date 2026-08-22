'use client';
// FILE: src/components/seeker/PipelineView/GroupCard.tsx
import { ChevronDown } from 'lucide-react';
import PipelineCard, { STAGES, STAGE_ORDER } from '../PipelineCard';
import CompanyLogo from '../CompanyLogo';
import type { CompanyGroup } from './group-by-company';

interface Props {
  group: CompanyGroup;
  isOpen: boolean;
  onToggle: () => void;
  onStageChange: (jobId: string, newStage: string) => void;
}

export default function GroupCard({ group, isOpen, onToggle, onStageChange }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: '12px 14px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', color: 'var(--ink)',
        }}
      >
        <CompanyLogo name={group.company} size={32} borderRadius={9} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.92rem', fontWeight: 600,
            color: 'var(--ink)', letterSpacing: '-0.01em',
          }}>{group.company}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: 1 }}>
            {group.jobs.length} role{group.jobs.length === 1 ? '' : 's'} · best: {STAGES[group.bestStage].label}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {STAGE_ORDER.filter(s => group.stageCounts[s] > 0).map(s => (
            <span key={s} style={{
              fontSize: '0.7rem', fontWeight: 600,
              padding: '2px 7px', borderRadius: 6,
              background: STAGES[s].bg, color: STAGES[s].color,
            }}>{group.stageCounts[s]}</span>
          ))}
        </div>
        <ChevronDown size={16} style={{
          color: 'var(--ink-faint)',
          transition: 'transform 200ms ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }} />
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.jobs.map(j => (
            <PipelineCard key={j.jobId} {...j} onStageChange={onStageChange} />
          ))}
        </div>
      )}
    </div>
  );
}
