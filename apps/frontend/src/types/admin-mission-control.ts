// FILE: src/types/admin-mission-control.ts
// Shape contract for GET /api/admin/overview. Mirrors the backend's
// mission-control-service output exactly — no field the backend does not send.

export interface WeekDelta {
  thisWeek: number;
  prevWeek: number;
  delta: number;
}

export interface WeekPoint {
  /** ISO timestamp of the window's start. */
  weekStart: string;
  count: number;
}

export interface MissionControlTotals {
  seekers: number;
  employers: number;
  companies: number;
  livePostings: number;
  scrapedJobs: number;
  applicationsTotal: number;
}

export interface MissionControlOverview {
  totals: MissionControlTotals;
  newSeekers: WeekDelta;
  newApplications: WeekDelta;
  newPostings: WeekDelta;
  weeklyApplications: WeekPoint[];
}

export interface QueueStatusLine {
  key: string;
  label: string;
  failedCount: number;
  oldestPendingAgeMs: number | null;
}

export interface AiSnapshotKey {
  keyIndex: number;
  exhausted: boolean;
}

export interface AiSnapshotModel {
  model: string;
  keys: AiSnapshotKey[];
}

export interface SystemStatus {
  dbOk: boolean;
  scraperLastSuccessAt: string | null;
  queues: QueueStatusLine[];
  ai: { models: AiSnapshotModel[] };
  /** null when the platform cannot report it — the UI hides the tile. */
  diskFreeBytes: number | null;
}

export interface MissionControlPayload {
  overview: MissionControlOverview;
  status: SystemStatus;
}
