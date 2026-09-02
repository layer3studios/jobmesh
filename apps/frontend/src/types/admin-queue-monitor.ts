// FILE: src/types/admin-queue-monitor.ts
// Shape contract for /api/admin/queues. Mirrors the backend's
// queue-monitor-service output exactly — no field the backend does not send.

/** Status vocabularies differ per queue, so counts are an open map. */
export type QueueCounts = Record<string, number>;

export interface QueueSummary {
  key: string;
  label: string;
  collection: string;
  counts: QueueCounts;
  totalJobs: number;
  pendingStatus: string;
  processingStatus: string;
  failedStatus: string;
  /** The job field shown as the row's identity, e.g. 'userId'. */
  identityField: string;
  /** Age of the oldest job actually waiting on a worker; null when none are. */
  oldestPendingAgeMs: number | null;
  failedCount: number;
  lastCompletedAt: string | null;
}

export interface FailedJob {
  id: string;
  identityLabel: string;
  identityValue: string | null;
  errorMessage: string | null;
  attemptCount: number | null;
  createdAt: string | null;
  failedAt: string | null;
}

export interface QueueOverview {
  queues: QueueSummary[];
}

export interface RetryResult {
  retried: boolean;
  reason?: 'unknown_queue' | 'invalid_job_id' | 'not_found_or_not_failed';
  queueKey?: string;
  jobId?: string;
}
