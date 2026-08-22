'use client';
// FILE: src/components/employer/jobs/ExportApplicantsButton.tsx
// "Export" in the ranked toolbar: fetches the CSV with the auth cookie, then hands
// the blob to the browser as a download. A plain link cannot do this — the endpoint
// is authenticated, and the count in the toast comes from a response header.

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { exportApplicantsCsv } from '@/api/employer-import-export-api';
import { EmployerJobsApiError } from '@/api/employer-jobs-api';

export default function ExportApplicantsButton({ postingId }: { postingId: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { blob, filename, count } = await exportApplicantsCsv(postingId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoked on the next tick: revoking synchronously can cancel the download
      // in some browsers before it has read the blob.
      setTimeout(() => URL.revokeObjectURL(url), 0);
      showToast('success', `Exported ${count} applicant${count === 1 ? '' : 's'}.`);
    } catch (error) {
      showToast('error', error instanceof EmployerJobsApiError ? error.message : 'Could not export applicants.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => void handleExport()} disabled={isExporting}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Download size={14} aria-hidden="true" />
        {isExporting ? 'Exporting…' : 'Export'}
      </span>
    </Button>
  );
}
