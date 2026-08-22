'use client';
// FILE: src/components/employer/jobs/ApplicantResumeViewer.tsx
// Resume panel: a toolbar (filename + open-in-new-tab + download + refresh) above an
// <iframe> pointed at the 7A signed URL. The raw iframe is intentional — no UI
// primitive renders an inline PDF, and every modern browser has a built-in viewer
// (R1). The URL has a 15-min TTL (C10): a 401 fires the iframe error → we show an
// Alert with a Refresh button, and "Refresh" also re-signs on demand.

import { useState } from 'react';
import { ExternalLink, Download, RefreshCw } from 'lucide-react';
import { Card, Button, Alert, Stack } from '@/components/ui';
import { refreshResumeUrl } from '@/api/employer-applicants-api';
import type { ResumeMeta } from '@/types/employer-applicants';

const REFRESH_ERROR = 'Could not refresh the resume link.';

// Default the browser PDF viewer to fit-width + no thumbnail/nav pane — best for a
// full-page portrait resume (P2.3, R1). navpanes=0 hides the left thumbnail rail.
// Chrome/Firefox/Safari honour these hash fragments; append with & if the URL already
// carries a fragment so we never produce a double '#'.
const PDF_VIEW_FRAGMENT = 'zoom=page-width&navpanes=0';
function appendPdfZoomFragment(url: string): string {
  return url.includes('#') ? `${url}&${PDF_VIEW_FRAGMENT}` : `${url}#${PDF_VIEW_FRAGMENT}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default function ApplicantResumeViewer({
  applicationId, resumeMeta, initialUrl,
}: {
  applicationId: string;
  resumeMeta: ResumeMeta | null;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function refresh() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const next = await refreshResumeUrl(applicationId);
      setUrl(next.url);
      setLoadFailed(false);
    } catch {
      setRefreshError(REFRESH_ERROR);
    } finally {
      setRefreshing(false);
    }
  }

  if (!resumeMeta || !url) {
    return (
      <Card padding="md">
        <Alert type="warning">This candidate has not uploaded a resume.</Alert>
      </Card>
    );
  }

  const filename = resumeMeta.originalFilename ?? 'Resume';
  const size = formatBytes(resumeMeta.sizeBytes);

  return (
    // data-ph-mask: resume filename + embedded document are personal data — masked in replay.
    <div data-ph-mask style={{ display: 'contents' }}>
    <Card padding="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
        <Stack gap={8} dir="row" align="center" justify="space-between" wrap>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</div>
            {size && <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{size}</div>}
          </div>
          <Stack gap={8} dir="row" align="center" wrap>
            <Button as="a" href={url} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" iconLeft={<ExternalLink size={15} />}>Open</Button>
            <Button as="a" href={url} download={filename} variant="ghost" size="sm" iconLeft={<Download size={15} />}>Download</Button>
            <Button variant="ghost" size="sm" loading={refreshing} onClick={() => void refresh()} iconLeft={<RefreshCw size={15} />}>Refresh</Button>
          </Stack>
        </Stack>

        {refreshError && <Alert type="error">{refreshError}</Alert>}

        {loadFailed ? (
          <Alert type="error">
            <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
              <span>Resume unavailable — the secure link may have expired.</span>
              <Button variant="ghost" size="sm" loading={refreshing} onClick={() => void refresh()}>Refresh resume</Button>
            </Stack>
          </Alert>
        ) : (
          <iframe
            key={url}
            title={`Resume — ${filename}`}
            src={appendPdfZoomFragment(url)}
            onError={() => setLoadFailed(true)}
            style={{ flex: 1, minHeight: 0, width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--paper-2)' }}
          />
        )}
      </div>
    </Card>
    </div>
  );
}
