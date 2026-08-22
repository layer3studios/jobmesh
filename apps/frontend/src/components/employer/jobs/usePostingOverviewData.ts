// FILE: src/components/employer/jobs/usePostingOverviewData.ts
// KPI + snapshot data for the Overview dashboard, from EXISTING endpoints only:
// the applicant list (+stages) and the booked pool-time count. Any failed load
// leaves its numbers null → tiles render "—".

import { useEffect, useState } from 'react';
import { listApplicantsForPosting, listStages } from '../../../api/employer-applicants-api';
import { listInterviewTimes } from '../../../api/employer-interview-times-api';
import type { Stage } from '../../../types/employer-applicants';
import { usableScore } from './score-badge-helpers';

export interface PostingOverviewData {
  totalApplicants: number | null;
  averageScore: number | null;
  interviewsScheduled: number | null;
  stages: Stage[];
  /** stageId → applicant count (unarchived), for the pipeline snapshot bar. */
  stageCounts: Map<string, number>;
}

const EMPTY: PostingOverviewData = {
  totalApplicants: null, averageScore: null, interviewsScheduled: null,
  stages: [], stageCounts: new Map(),
};

export function usePostingOverviewData(postingId: string): PostingOverviewData {
  const [data, setData] = useState<PostingOverviewData>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: PostingOverviewData = { ...EMPTY, stageCounts: new Map() };
      try {
        const [applicants, stages] = await Promise.all([listApplicantsForPosting(postingId), listStages()]);
        const active = applicants.filter((applicant) => applicant.application.archived == null);
        next.totalApplicants = active.length;
        next.stages = stages;
        for (const applicant of active) {
          const stageId = applicant.application.stageId;
          next.stageCounts.set(stageId, (next.stageCounts.get(stageId) ?? 0) + 1);
        }
        const scores = active.map((applicant) => usableScore(applicant.score)).filter((s): s is number => s !== null);
        next.averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;
      } catch { /* tiles show "—" */ }
      try {
        const booked = await listInterviewTimes(postingId, { status: 'booked', includePast: true });
        next.interviewsScheduled = booked.length;
      } catch { /* tile shows "—" */ }
      if (!cancelled) setData(next);
    })();
    return () => { cancelled = true; };
  }, [postingId]);

  return data;
}
