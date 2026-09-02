// FILE: src/types/admin-scraper-health.ts
// Shape contract for /api/admin/scraper-health. Mirrors the backend's
// scraper-health-service output exactly — no field the backend does not send.

export interface ScrapeRun {
  runId: string;
  siteName: string;
  /** ISO strings over the wire; the backend stores real Dates. */
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  jobsFetched: number;
  newJobs: number;
  deletedExpired: number;
  scrapedSuccessfully: boolean;
  errorMessage: string | null;
}

export interface SiteSummary {
  siteName: string;
  lastRun: ScrapeRun | null;
  lastSuccessfulRun: ScrapeRun | null;
  latestNewJobs: number;
  /** Mean newJobs over the last 7 successful runs, one decimal. */
  avgNewJobs: number;
  successfulRunCount: number;
  /** Latest successful run came in under 30% of the average, with enough history. */
  isVolumeAnomalous: boolean;
  lastRunFailed: boolean;
  errorMessage: string | null;
}

export interface CorpusQuality {
  totalJobs: number;
  cleanedCount: number;
  taggedCount: number;
  salaryCount: number;
  /** Percentages, already rounded to one decimal by the backend. */
  pctCleaned: number;
  pctTagged: number;
  pctSalary: number;
  duplicateJobIds: number;
}

export interface ScraperHealthOverview {
  sites: SiteSummary[];
  corpus: CorpusQuality;
}

export interface RunNowResult {
  started: boolean;
  reason?: 'already_running';
}
