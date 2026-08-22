'use client';
// FILE: src/components/apply/useAssignmentFiles.ts
// Owns the staged-upload list for the assignment submission.
//
// THE CENTRAL RULE: every file is INDEPENDENT. Each has its own request, its own
// AbortController, its own status and its own error, so one failed upload never
// touches the others — the candidate retries that one row and the rest stay 'done'.
// A batch upload would fail all five because of one flaky connection, which is the
// exact moment someone abandons an application they already did the work for.
//
// The row list is held in a ref AND in state, and every mutation goes through
// commit(). State updater callbacks are deliberately not used: they must be pure,
// and React re-invokes them under StrictMode — starting an upload from inside one
// would fire the same POST twice.

import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadAssignmentFile } from '@/api/assignment-files-api';
import { PublicApiError } from '@/api/public-api';
import { MAX_FILE_BYTES, MAX_SUBMISSION_FILES } from './assignment-validation';
import { trackEvent } from '@/lib/analytics-events';
import type { DraftFileEntry } from './assignment-draft';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface AssignmentFileRow {
  /** Stable client-side key. Not the server fileId — a row exists before one does. */
  localId: string;
  file: File | null;
  /** The signed staging token. Present only once the upload succeeded. */
  fileId: string | null;
  originalName: string;
  sizeBytes: number | null;
  status: UploadStatus;
  error: string | null;
}

interface Options {
  postingId: string;
  allowedFileTypes: string[];
  /**
   * False for a plain posting. Rule 1: with no assignment, nothing in this hook ever
   * runs — no requests, no state churn, no unmount work.
   */
  enabled: boolean;
}

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `af-${localIdCounter}`;
}

function extensionOf(name: string): string {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export interface UseAssignmentFiles {
  files: AssignmentFileRow[];
  /** Rows the submit gate may count — uploaded and still valid. */
  doneFiles: AssignmentFileRow[];
  /** True while any row is still uploading; the submit gate must not count those. */
  uploading: boolean;
  addFiles: (list: FileList | File[]) => void;
  retry: (localId: string) => void;
  remove: (localId: string) => void;
  restoreFromDraft: (entries: DraftFileEntry[]) => void;
  markExpired: (fileIds: string[]) => void;
}

export function useAssignmentFiles({ postingId, allowedFileTypes, enabled }: Options): UseAssignmentFiles {
  const [files, setFiles] = useState<AssignmentFileRow[]>([]);
  const filesRef = useRef<AssignmentFileRow[]>([]);
  const controllers = useRef<Map<string, AbortController>>(new Map());

  const commit = useCallback((next: AssignmentFileRow[]) => {
    filesRef.current = next;
    setFiles(next);
  }, []);

  const patch = useCallback((localId: string, changes: Partial<AssignmentFileRow>) => {
    commit(filesRef.current.map((row) => (row.localId === localId ? { ...row, ...changes } : row)));
  }, [commit]);

  // Abort every in-flight upload if the form unmounts mid-pick. Without this, a
  // navigation leaves requests running whose results nothing will ever read.
  useEffect(() => {
    const inFlight = controllers.current;
    return () => {
      for (const controller of inFlight.values()) controller.abort();
      inFlight.clear();
    };
  }, []);

  const startUpload = useCallback((localId: string, file: File) => {
    const controller = new AbortController();
    controllers.current.set(localId, controller);
    uploadAssignmentFile(file, controller.signal)
      .then((staged) => {
        controllers.current.delete(localId);
        patch(localId, {
          fileId: staged.fileId,
          originalName: staged.originalName ?? file.name,
          sizeBytes: staged.sizeBytes ?? file.size,
          status: 'done',
          error: null,
        });
      })
      .catch((err: unknown) => {
        controllers.current.delete(localId);
        // An abort is a removal we initiated — the row is already gone, and flipping
        // it to 'error' would resurrect a deleted file in the UI.
        if (err instanceof Error && err.name === 'AbortError') return;
        const reason = err instanceof PublicApiError ? (err.code ?? 'HTTP_ERROR') : 'NETWORK';
        const message = err instanceof PublicApiError
          ? err.message
          : 'Upload failed. Check your connection and try again.';
        // `reason` is a stable code — never the filename or the message (no PII).
        trackEvent('assignment_file_upload_failed', { postingId, reason });
        patch(localId, { status: 'error', error: message });
      });
  }, [patch, postingId]);

  const addFiles = useCallback((list: FileList | File[]) => {
    if (!enabled) return;
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;

    const rows = filesRef.current;
    const added: AssignmentFileRow[] = [];
    const toUpload: Array<{ localId: string; file: File }> = [];
    let slots = MAX_SUBMISSION_FILES - rows.length;
    const rejectedRow = (file: File, error: string): AssignmentFileRow => ({
      localId: nextLocalId(), file: null, fileId: null, originalName: file.name,
      sizeBytes: file.size, status: 'error', error,
    });

    for (const file of picked) {
      // Client-side gates run BEFORE any request. A .exe or an 11MB file is refused
      // locally and never reaches the network — the backend would reject it anyway,
      // after the candidate waited for the whole upload to finish.
      if (slots <= 0) {
        added.push(rejectedRow(file, `You can attach at most ${MAX_SUBMISSION_FILES} files.`));
        continue;
      }
      slots -= 1;
      const ext = extensionOf(file.name);
      if (allowedFileTypes.length > 0 && !allowedFileTypes.map((type) => type.toLowerCase()).includes(ext)) {
        added.push(rejectedRow(
          file, `Only ${allowedFileTypes.map((type) => type.toUpperCase()).join(', ')} files are accepted.`,
        ));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        added.push(rejectedRow(file, `File must be ${formatMegabytes(MAX_FILE_BYTES)} or smaller.`));
        continue;
      }
      const localId = nextLocalId();
      added.push({
        localId, file, fileId: null, originalName: file.name,
        sizeBytes: file.size, status: 'uploading', error: null,
      });
      toUpload.push({ localId, file });
    }

    commit([...rows, ...added]);
    for (const entry of toUpload) startUpload(entry.localId, entry.file);
  }, [enabled, allowedFileTypes, commit, startUpload]);

  const retry = useCallback((localId: string) => {
    if (!enabled) return;
    const row = filesRef.current.find((entry) => entry.localId === localId);
    if (!row?.file) return; // nothing to re-send (a restored or client-rejected row)
    patch(localId, { status: 'uploading', error: null });
    startUpload(localId, row.file);
  }, [enabled, patch, startUpload]);

  const remove = useCallback((localId: string) => {
    if (!enabled) return;
    const controller = controllers.current.get(localId);
    if (controller) {
      controller.abort(); // cancels ONLY this upload
      controllers.current.delete(localId);
    }
    commit(filesRef.current.filter((row) => row.localId !== localId));
  }, [enabled, commit]);

  /**
   * Seed rows from a restored draft. These arrive already 'done': the bytes are on
   * the backend and the fileId is all the submit needs. There is no File object, so
   * retry is not offered for them — see assignment-draft.ts for why they are assumed
   * still alive (draft TTL === backend staging TTL).
   */
  const restoreFromDraft = useCallback((entries: DraftFileEntry[]) => {
    if (!enabled) return;
    commit(entries.slice(0, MAX_SUBMISSION_FILES).map((entry) => ({
      localId: nextLocalId(), file: null, fileId: entry.fileId, originalName: entry.originalName,
      sizeBytes: null, status: 'done' as const, error: null,
    })));
  }, [enabled, commit]);

  /**
   * Flip the named rows to 'error' after a STAGED_FILES_EXPIRED submit. Everything
   * else is untouched — only the aged-out files need re-uploading.
   */
  const markExpired = useCallback((fileIds: string[]) => {
    if (!enabled) return;
    const expired = new Set(fileIds);
    commit(filesRef.current.map((row) => (
      row.fileId && expired.has(row.fileId)
        ? { ...row, status: 'error' as const, fileId: null, error: 'This upload expired. Please attach it again.' }
        : row
    )));
  }, [enabled, commit]);

  return {
    files,
    doneFiles: files.filter((row) => row.status === 'done' && row.fileId),
    uploading: files.some((row) => row.status === 'uploading'),
    addFiles, retry, remove, restoreFromDraft, markExpired,
  };
}
