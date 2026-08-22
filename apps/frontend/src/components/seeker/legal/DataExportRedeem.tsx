'use client';
// FILE: src/components/seeker/legal/DataExportRedeem.tsx
// The landing page for an emailed one-time data-export link.
//
// THE DOWNLOAD IS AN EXPLICIT BUTTON, NOT AN AUTOMATIC REDIRECT. The token is
// consumed by the request that serves the file, so anything that fetches on mount —
// a prefetch, a preview bot, a double-render in development — spends the person's
// one use before they have seen the page. A button is pressed once, by a human,
// on purpose.
//
// After the press the link is dead, and the page says so rather than leaving a
// button that will silently 404 the second time.

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { Container, Card, Stack, Button, Alert } from '@/components/ui';
import { myDataExportDownloadUrl } from '@/api/dpdp-api';

const HEADING_STYLE = { margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)' };
const BODY_STYLE = { margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ink-muted)' };

export default function DataExportRedeem() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [hasDownloaded, setHasDownloaded] = useState(false);

  return (
    <Container size="sm" style={{ paddingTop: 48, paddingBottom: 72 }}>
      <Card>
        <Stack gap={14}>
          <h1 style={HEADING_STYLE}>Download your data</h1>
          {!token && (
            <Alert type="error">
              This link is missing its token. Open the link from your email exactly as it was sent.
            </Alert>
          )}
          {token && !hasDownloaded && (
            <>
              <p style={BODY_STYLE}>
                This link works once. Your data downloads as a JSON file — keep it somewhere safe,
                because you&rsquo;ll need a new link to download it again.
              </p>
              <div>
                <Button
                  iconLeft={<Download size={15} aria-hidden="true" />}
                  onClick={() => {
                    setHasDownloaded(true);
                    window.location.href = myDataExportDownloadUrl(token);
                  }}
                >
                  Download my data
                </Button>
              </div>
            </>
          )}
          {hasDownloaded && (
            <>
              <Alert type="success">Your download has started.</Alert>
              <p style={BODY_STYLE}>
                This link has now been used. To download your data again, request a new link from
                the company&rsquo;s careers page.
              </p>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
}
