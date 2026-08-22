// FILE: src/components/seeker/JobDetailPanel/index.tsx
// Orchestrator. Composes Header + Actions + Body.

import type { IJob } from '../../../types';
import Header from './Header';
import Actions from './Actions';
import Body from './Body';

interface Props {
  job: IJob;
  domain?: string;
  mobileMode?: boolean;
  is3xl?: boolean;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  onToggleApplied: (jobId: string) => void;
  onToggleComeBack: (jobId: string, note?: string) => void;
  onRemoveComeBack?: (jobId: string) => void;
  onSelectJob?: (job: IJob) => void;
}

export default function JobDetailPanel({
  job, domain, mobileMode, is3xl, appliedJobIds,
  comeBackMap, onToggleApplied, onToggleComeBack, onRemoveComeBack, onSelectJob,
}: Props) {
  void is3xl;

  const isApplied = appliedJobIds.has(job._id);
  const isComeBack = !!comeBackMap[job._id];
  const note = comeBackMap[job._id] || '';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--surface)', overflow: 'hidden',
    }}>
      <div style={{
        padding: mobileMode ? '16px 16px 12px' : '20px 22px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <Header job={job} domain={domain} mobileMode={mobileMode} />
        <Actions
          job={job}
          mobileMode={mobileMode}
          isApplied={isApplied}
          isComeBack={isComeBack}
          note={note}
          onToggleApplied={onToggleApplied}
          onToggleComeBack={onToggleComeBack}
          onRemoveComeBack={onRemoveComeBack}
        />
      </div>
      <Body job={job} mobileMode={mobileMode} onSelectJob={onSelectJob} />
    </div>
  );
}
