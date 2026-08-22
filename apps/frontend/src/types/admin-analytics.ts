// FILE: src/types/admin-analytics.ts
// Response shapes for the admin analytics dashboard, matching the backend
// /api/admin/analytics/* contracts. Field names follow the documented contract
// ({date}, {type}); the api module normalizes any backend variance (day→date,
// device→type) before these types are handed to components.

export type SinceRange = '24h' | '7d' | '30d';

export interface DailyCount {
  date: string;
  count: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface ReferrerBucket {
  bucket: string;
  count: number;
}

export interface DeviceBucket {
  type: string;
  count: number;
}

// Every endpoint echoes when the data was cached and the resolved `since` window.
export interface AnalyticsMeta {
  cachedAt: string;
  since: string;
}

export interface VolumeResponse extends AnalyticsMeta {
  visitorsTotal: number;
  visitorsByDay: DailyCount[];
  pageviewsTotal: number;
  pageviewsByDay: DailyCount[];
}

export interface SeekerResponse extends AnalyticsMeta {
  signups: number;
  logins: number;
  jobsListViews: number;
  jobDetailViews: number;
  applyStarted: number;
  applySubmitted: number;
  applySuccessViewed: number;
  funnel: FunnelStage[];
}

export interface EmployerResponse extends AnalyticsMeta {
  signups: number;
  logins: number;
  onboardingStarted: number;
  onboardingCompleted: number;
  postingsCreated: number;
  postingsPublished: number;
  funnel: FunnelStage[];
}

export interface EngagementResponse extends AnalyticsMeta {
  applicantsViewed: number;
  applicantsMovedStage: number;
  applicantsArchived: number;
  notesAdded: number;
}

export interface TeamResponse extends AnalyticsMeta {
  invitesSent: number;
  invitesAccepted: number;
}

export interface TrafficResponse extends AnalyticsMeta {
  byReferrer: ReferrerBucket[];
  byDevice: DeviceBucket[];
}

// All six bundled together — what the server page passes to the client.
export interface AdminAnalyticsData {
  volume: VolumeResponse;
  seeker: SeekerResponse;
  employer: EmployerResponse;
  engagement: EngagementResponse;
  team: TeamResponse;
  traffic: TrafficResponse;
}
