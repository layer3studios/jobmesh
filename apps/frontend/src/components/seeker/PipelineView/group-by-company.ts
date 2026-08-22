// FILE: src/components/seeker/PipelineView/group-by-company.ts
import type { StageName } from '../pipeline-stages';

export interface PipelineJob {
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
}

export interface CompanyGroup {
  company: string;
  jobs: PipelineJob[];
  stageCounts: Record<string, number>;
  hasActive: boolean;
  latestActivity: number;
  bestStage: StageName;
}

const STAGE_PRIORITY: Record<string, number> = {
  screening: 0, interview: 1, offer: 2, applied: 3,
  accepted: 4, rejected: 5, ghosted: 6,
};

export function groupByCompany(jobs: PipelineJob[]): CompanyGroup[] {
  const map = new Map<string, PipelineJob[]>();
  for (const job of jobs) {
    const key = (job.company || 'Unknown').toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(job);
  }
  const groups: CompanyGroup[] = [];
  for (const [, groupJobs] of map) {
    const stageCounts: Record<string, number> = {};
    let hasActive = false; let latestActivity = 0;
    let bestPriority = 99; let bestStage: StageName = 'applied';
    for (const j of groupJobs) {
      const s = j.stage || 'applied';
      stageCounts[s] = (stageCounts[s] || 0) + 1;
      if (s === 'screening' || s === 'interview' || s === 'offer') hasActive = true;
      const t1 = new Date(j.stageUpdatedAt).getTime();
      const t2 = new Date(j.appliedAt).getTime();
      const t = Math.max(isNaN(t1) ? 0 : t1, isNaN(t2) ? 0 : t2);
      if (t > latestActivity) latestActivity = t;
      const p = STAGE_PRIORITY[s] ?? 9;
      if (p < bestPriority) { bestPriority = p; bestStage = s as StageName; }
    }
    groupJobs.sort((a, b) => {
      const pa = STAGE_PRIORITY[a.stage || 'applied'] ?? 9;
      const pb = STAGE_PRIORITY[b.stage || 'applied'] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.stageUpdatedAt).getTime() - new Date(a.stageUpdatedAt).getTime();
    });
    groups.push({ company: groupJobs[0].company || 'Unknown', jobs: groupJobs, stageCounts, hasActive, latestActivity, bestStage });
  }
  groups.sort((a, b) => {
    const aAllDead = a.jobs.every(j => j.stage === 'ghosted' || j.stage === 'rejected');
    const bAllDead = b.jobs.every(j => j.stage === 'ghosted' || j.stage === 'rejected');
    if (aAllDead !== bAllDead) return aAllDead ? 1 : -1;
    if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
    return b.latestActivity - a.latestActivity;
  });
  return groups;
}
