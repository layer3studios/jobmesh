// FILE: src/components/seeker/JobDetailPanel/index.tsx
// Orchestrator. Composes Header + Actions + Body. Keyed by job id so a new
// selection crossfades in (jobs-board.css .jb-swap) instead of snapping.

import type { IJob } from '../../../types';
import Header from './Header';
import Actions from './Actions';
import Body from './Body';

interface Props {
  job: IJob;
  domain?: string;
  mobileMode?: boolean;
  /** Heading level of the job title; 'h1' on the standalone SEO page. */
  titleAs?: 'h1' | 'h2';
  is3xl?: boolean;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  onToggleApplied: (jobId: string) => void;
  onToggleComeBack: (jobId: string, note?: string) => void;
  onRemoveComeBack?: (jobId: string) => void;
  onSelectJob?: (job: IJob) => void;
}

export default function JobDetailPanel({
  job, domain, mobileMode, titleAs, is3xl, appliedJobIds,
  comeBackMap, onToggleApplied, onToggleComeBack, onRemoveComeBack, onSelectJob,
}: Props) {
  void is3xl;

  const isApplied = appliedJobIds.has(job._id);
  const isComeBack = !!comeBackMap[job._id];
  const note = comeBackMap[job._id] || '';

  return (
    <div key={job._id} className={`jb-detail__inner jb-swap${mobileMode ? ' jb-detail--mobile' : ''}`}>
      <div className="jb-detail__head">
        <Header job={job} domain={domain} mobileMode={mobileMode} titleAs={titleAs} />
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
