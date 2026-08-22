// FILE: src/types/employer-dashboard.ts
// Shape contract for the employer dashboard endpoints. Mirrors the backend
// dashboard-summary/activity services exactly — no field the backend does not
// return. The activity event is a discriminated union on `type`.

export interface DashboardKpis {
  activeJobs: number;
  totalApplicants: number;
  interviewsThisWeek: number;
  avgAiScore: number | null;
  avgDaysToHire: number | null;
}

export interface DashboardStageCounts {
  applied: number;
  shortlisted: number;
  interview: number;
  offer: number;
  hired: number;
}

export interface DashboardActiveJob {
  id: string;
  title: string;
  location: string | null;
  workplaceType: string | null;
  applicantCount: number;
  daysOpen: number;
  stageCounts: DashboardStageCounts;
}

export interface DashboardTopCandidate {
  applicationId: string;
  contactName: string | null;
  contactEmail: string | null;
  postingTitle: string | null;
  stage: string | null;
  score: number | null;
  appliedAt: string;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  activeJobs: DashboardActiveJob[];
  topCandidates: DashboardTopCandidate[];
}

interface ActivityEventBase {
  candidateName: string | null;
  postingTitle: string | null;
  timestamp: string;
}

export type DashboardActivityEvent =
  | (ActivityEventBase & { type: 'application' })
  | (ActivityEventBase & { type: 'stage_move'; fromStage: string | null; toStage: string | null })
  | (ActivityEventBase & { type: 'interview_booked'; interviewTime: string | null })
  | (ActivityEventBase & { type: 'interview_cancelled' })
  | (ActivityEventBase & { type: 'score_completed'; score: number | null });
