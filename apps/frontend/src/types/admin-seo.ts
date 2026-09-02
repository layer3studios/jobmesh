// FILE: src/types/admin-seo.ts
// Shape contract for /api/admin/seo. Mirrors seo-health-service exactly.

export interface SchemaHealth {
  /** Live NATIVE postings — the only ones with a JobPosting JSON-LD page. */
  total: number;
  missingSalary: number;
  missingLocation: number;
  missingEmploymentType: number;
}

export interface IndexingFailure {
  id: string;
  postingId: string | null;
  url: string | null;
  action: 'URL_UPDATED' | 'URL_DELETED';
  attemptCount: number;
  lastError: string | null;
  completedAt: string | null;
}

export interface IndexingStats {
  counts: Record<string, number>;
  submittedToday: number;
  dailyQuota: number;
  quotaRemaining: number;
  recentFailures: IndexingFailure[];
}

export interface StaleUrl {
  postingId: string;
  title: string | null;
  slug: string | null;
  status: string | null;
  closedAt: string | null;
}

export interface SeoPayload {
  /** False when GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON is unset. */
  configured: boolean;
  schema: SchemaHealth;
  indexing: IndexingStats;
  staleUrls: StaleUrl[];
}
