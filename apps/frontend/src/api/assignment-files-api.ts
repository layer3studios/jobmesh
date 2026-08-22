// FILE: src/api/assignment-files-api.ts
// Staging upload for take-home assignment files (POST /api/public/assignment-files).
//
// Files upload IMMEDIATELY on pick, one request each, long before the application is
// submitted. The backend hands back an opaque signed fileId; the final apply POST
// carries only those ids and never re-sends bytes. That is what makes a 10MB zip
// survive a form the candidate spends an hour in.
//
// Unauthenticated, like the rest of the apply flow — no credentials are sent.
// Errors are thrown as PublicApiError so mapServerError keeps working unchanged.

import { apiUrl } from '../lib/api-base';
import { PublicApiError } from './public-api';

export interface StagedFile {
  fileId: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  expiresAt: string;
}

/**
 * Stage one file. `signal` comes from a per-file AbortController so removing a file
 * mid-upload cancels only that request and leaves its siblings alone.
 */
export async function uploadAssignmentFile(file: File, signal?: AbortSignal): Promise<StagedFile> {
  const form = new FormData();
  form.append('file', file); // field name must stay 'file' — multer .single('file')

  const response = await fetch(apiUrl('/public/assignment-files'), {
    method: 'POST',
    body: form,
    signal,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PublicApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Upload failed (${response.status})`,
      body ?? {},
    );
  }
  return body as StagedFile;
}
