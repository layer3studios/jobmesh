// FILE: src/api/employer-import-export-api.ts
// Candidates in and out of one posting: the applicant CSV export, and the two
// bulk-import methods. Separate from employer-jobs-api because these speak
// multipart and blobs rather than JSON, and reuse its error type so every posting
// surface reports failures the same way.

import { apiUrl } from '../lib/api-base';
import { EmployerJobsApiError } from './employer-jobs-api';

const postingPath = (postingId: string) => `/employer/jobs/${encodeURIComponent(postingId)}`;

/** Read the error body of a failed response and throw it in the shared shape. */
async function throwApiError(response: Response, fallback: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  throw new EmployerJobsApiError(
    response.status,
    body?.code ?? null,
    body?.error || `${fallback} (${response.status})`,
  );
}

export interface ApplicantCsvExport {
  blob: Blob;
  filename: string;
  /** Rows in the file, read from the X-Applicant-Count header the endpoint sets. */
  count: number;
}

/**
 * Download one posting's applicants as CSV. Fetched rather than window.open'd so
 * the auth cookie, the error path and the server-chosen filename all behave like
 * every other call here; the caller turns the blob into a download.
 */
export async function exportApplicantsCsv(postingId: string): Promise<ApplicantCsvExport> {
  const response = await fetch(apiUrl(`${postingPath(postingId)}/export/csv`), {
    credentials: 'include',
  });
  if (!response.ok) await throwApiError(response, 'Could not export applicants');
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="([^"]+)"/.exec(disposition);
  return {
    blob: await response.blob(),
    filename: match?.[1] ?? 'applicants.csv',
    count: Number(response.headers.get('X-Applicant-Count') ?? 0),
  };
}

/** Outcome of one import request. `errors` names the file or row that failed. */
export interface ImportSummary {
  imported: number;
  duplicates: number;
  failed: number;
  /** Skipped because the contact is flagged do-not-contact. Counted apart from
   *  duplicates and failures: neither is what happened. Absent on older responses. */
  doNotContact?: number;
  errors: Array<{ filename: string; reason: string }>;
}

async function postImport(path: string, form: FormData): Promise<ImportSummary> {
  // No Content-Type header: the browser must set the multipart boundary itself.
  const response = await fetch(apiUrl(path), { method: 'POST', credentials: 'include', body: form });
  if (!response.ok) await throwApiError(response, 'Import failed');
  return (await response.json()) as ImportSummary;
}

/** Import a ZIP of resume PDFs as candidates on this posting. */
export async function importResumeArchive(postingId: string, archive: File): Promise<ImportSummary> {
  const form = new FormData();
  form.append('archive', archive);
  return postImport(`${postingPath(postingId)}/import/resumes`, form);
}

/** Import candidates from a CSV, with resumes attached as an optional ZIP. */
export async function importCandidateCsv(
  postingId: string,
  csv: File,
  resumeZip: File | null = null,
): Promise<ImportSummary> {
  const form = new FormData();
  form.append('csv', csv);
  if (resumeZip) form.append('resumeZip', resumeZip);
  return postImport(`${postingPath(postingId)}/import/csv`, form);
}
