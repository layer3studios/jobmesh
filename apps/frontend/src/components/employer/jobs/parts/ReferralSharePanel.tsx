'use client';
// FILE: src/components/employer/jobs/parts/ReferralSharePanel.tsx
// "Refer someone" on the posting overview. One button that mints (or re-reads)
// the signed-in teammate's link and copies it, plus their running totals.
//
// The link is fetched ON CLICK, never on mount: most people open a posting to
// read it, and minting a referral row for every visit would fill the activity
// table with links nobody ever shared. The backend call is idempotent, so the
// second click on the same posting returns the same token and the same stats.

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button, Card, Stack, useToast } from '@/components/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { COPY } from '@/theme/brand';
import { createReferralLink, type ReferralLink } from '@/api/employer-referrals-api';

const TEXT = COPY.employer.referrals;

/** "12 clicks · 3 applications from your link" */
function statsLine(link: ReferralLink): string {
  if (link.clickCount === 0 && link.applicationCount === 0) return TEXT.statsEmpty;
  return TEXT.stats
    .replace('{clicks}', String(link.clickCount))
    .replace('{applications}', String(link.applicationCount));
}

export default function ReferralSharePanel({ postingId }: { postingId: string }) {
  const { showToast } = useToast();
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function handleCopy() {
    setIsWorking(true);
    try {
      // Re-fetch on every click rather than trusting cached state: the counters
      // move whenever someone opens the link, and a stale number here would read
      // as "my link isn't working".
      const fresh = await createReferralLink(postingId);
      setLink(fresh);
      const copied = await copyToClipboard(fresh.referralUrl);
      showToast(copied ? 'success' : 'error', copied ? TEXT.copied : TEXT.copyFailed);
    } catch {
      showToast('error', TEXT.copyFailed);
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <Card>
      <Stack gap={12}>
        <div>
          <h3 style={{
            margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)',
          }}>
            {TEXT.sectionTitle}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-muted)', maxWidth: '60ch' }}>
            {TEXT.sectionBody}
          </p>
        </div>

        <Stack gap={10} dir="row" align="center" wrap>
          <Button variant="secondary" onClick={() => void handleCopy()} disabled={isWorking}>
            <Stack gap={6} dir="row" align="center">
              <Share2 size={14} aria-hidden="true" />
              {isWorking ? TEXT.copying : TEXT.copyLink}
            </Stack>
          </Button>

          {/* Stats appear only once the person has a link — before that there is
              nothing true to say, and "0 clicks" would imply a link exists. */}
          {link && (
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{statsLine(link)}</span>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
