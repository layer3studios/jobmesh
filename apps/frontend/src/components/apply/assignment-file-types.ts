// FILE: src/components/apply/assignment-file-types.ts
// The shapes the assignment upload hook exposes: one row's status, the row
// itself, and the hook's return contract. Split out of useAssignmentFiles.ts
// (section 2) so a component can type against the rows without importing the hook.

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
