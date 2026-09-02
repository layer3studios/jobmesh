// FILE: src/types/admin-job-browser.ts
// Shape contract for /api/admin/jobs. Mirrors the backend's job-browser-service
// output exactly — no field the backend does not send.

export type JobSourceFilter = 'all' | 'scraped' | 'native';
export type HiddenFilter = 'exclude' | 'only' | 'all';

export interface JobRow {
  id: string;
  title: string | null;
  company: string | null;
  isNative: boolean;
  source: 'scraped' | 'native';
  /** Scraper site name; null for native postings. */
  siteName: string | null;
  location: string | null;
  status: string | null;
  postedAt: string | null;
  isHidden: boolean;
  adminHiddenAt: string | null;
}

/** The full document. Scraped jobs carry the PascalCase scraper schema. */
export interface JobDetail extends JobRow {
  description: string | null;
  descriptionIsCleaned: boolean;
  ApplicationURL?: string | null;
  DirectApplyURL?: string | null;
  slug?: string | null;
  Department?: string | null;
  ContractType?: string | null;
  SalaryMin?: number | null;
  SalaryMax?: number | null;
  SalaryCurrency?: string | null;
  SalaryInterval?: string | null;
  autoTags?: {
    techStack?: string[];
    roleCategory?: string | null;
    experienceBand?: string | null;
  } | null;
}

export interface JobSearchResult {
  jobs: JobRow[];
  total: number;
}

export interface DeleteResult {
  deleted: boolean;
  reason?: 'native_posting' | 'not_found' | 'invalid_id';
}
