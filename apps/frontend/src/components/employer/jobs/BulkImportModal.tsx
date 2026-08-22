'use client';
// FILE: src/components/employer/jobs/BulkImportModal.tsx
// Bulk candidate import for one posting, in two methods: a ZIP of resume PDFs
// (names and emails are read out of each resume), or a CSV of rows with resumes
// optionally attached as a ZIP.
//
// The upload is a single request, so there is no real byte-level progress to show;
// the bar is indeterminate and says what is happening instead of pretending to
// measure it. Results replace the form rather than sitting under it — after an
// import, what a recruiter needs is the outcome, not the file picker again.

import { useState } from 'react';
import { Alert, Button, Modal, Stack } from '@/components/ui';
import { importResumeArchive, importCandidateCsv } from '@/api/employer-import-export-api';
import type { ImportSummary } from '@/api/employer-import-export-api';
import { EmployerJobsApiError } from '@/api/employer-jobs-api';
import { FileDropzone, ImportResults } from './import-dropzone';

type Method = 'zip' | 'csv';

const CSV_COLUMNS = 'firstName, lastName, email, phone, source, tags, resumeFilename';

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: '7px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit',
  fontSize: '0.83rem', fontWeight: 600,
  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
  background: active ? 'var(--accent-soft)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--ink-muted)',
});

export default function BulkImportModal({ postingId, isOpen, onClose, onImported }: {
  postingId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called once after a run that created at least one candidate. */
  onImported: () => void;
}) {
  const [method, setMethod] = useState<Method>('zip');
  const [archive, setArchive] = useState<File | null>(null);
  const [csv, setCsv] = useState<File | null>(null);
  const [resumeZip, setResumeZip] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setArchive(null); setCsv(null); setResumeZip(null); setSummary(null); setError(null);
  };
  const close = () => { if (!isImporting) { reset(); onClose(); } };

  const selected = method === 'zip' ? archive : csv;

  async function handleImport() {
    if (!selected || isImporting) return;
    setIsImporting(true);
    setError(null);
    try {
      const result = method === 'zip'
        ? await importResumeArchive(postingId, archive!)
        : await importCandidateCsv(postingId, csv!, resumeZip);
      setSummary(result);
      if (result.imported > 0) onImported();
    } catch (caught) {
      setError(caught instanceof EmployerJobsApiError ? caught.message : 'Could not import these candidates.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Import candidates"
      size="md"
      footer={
        <Stack gap={8} dir="row" justify="flex-end">
          <Button variant="ghost" size="sm" onClick={close} disabled={isImporting}>
            {summary ? 'Done' : 'Cancel'}
          </Button>
          {summary ? (
            <Button variant="secondary" size="sm" onClick={reset}>Import more</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => void handleImport()}
              disabled={!selected || isImporting}>
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
          )}
        </Stack>
      }
    >
      <Stack gap={14}>
        {summary ? (
          <ImportResults summary={summary} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={TAB_STYLE(method === 'zip')} disabled={isImporting}
                onClick={() => { setMethod('zip'); setError(null); }}>
                Upload resumes (ZIP)
              </button>
              <button type="button" style={TAB_STYLE(method === 'csv')} disabled={isImporting}
                onClick={() => { setMethod('csv'); setError(null); }}>
                Import from CSV
              </button>
            </div>

            {method === 'zip' ? (
              <>
                <FileDropzone
                  accept=".zip,application/zip" file={archive} onFile={setArchive} disabled={isImporting}
                  label="Drop a ZIP of resume PDFs"
                  hint="Up to 200 PDFs, 50MB total. Names and emails are read from each resume."
                />
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
                  Files that aren’t PDFs are skipped, and a resume already on this posting counts as a duplicate.
                </p>
              </>
            ) : (
              <>
                <FileDropzone
                  accept=".csv,text/csv" file={csv} onFile={setCsv} disabled={isImporting}
                  label="Drop a CSV of candidates"
                  hint={`Columns: ${CSV_COLUMNS}`}
                />
                <FileDropzone
                  accept=".zip,application/zip" file={resumeZip} onFile={setResumeZip} disabled={isImporting}
                  label="Attach resumes (optional)"
                  hint="A ZIP whose filenames match the resumeFilename column."
                />
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
                  firstName, lastName and email are required. Rows missing one are reported and skipped.
                </p>
              </>
            )}

            {isImporting && (
              <div style={{ height: 4, borderRadius: 999, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: 'var(--accent)', animation: 'import-progress 1.1s ease-in-out infinite' }} />
                <style>{'@keyframes import-progress{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}'}</style>
              </div>
            )}
            {error && <Alert type="error">{error}</Alert>}
          </>
        )}
      </Stack>
    </Modal>
  );
}
