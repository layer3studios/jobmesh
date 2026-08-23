'use client';
// FILE: src/components/employer/jobs/parts/ReferralActivityList.tsx
// Owner+ view of who on the team has shared this posting, and what it produced.
// Rendered only when the caller is Owner+ (the backend 403s below that), so this
// component does no role checking of its own.
//
// Loads on mount rather than on click: unlike minting a link, reading the list has
// no side effect, and an owner opening the overview wants the numbers already there.

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, SkeletonLine, Stack } from '@/components/ui';
import { useToast } from '@/components/ui';
import { COPY } from '@/theme/brand';
import {
  listReferralLinks, deactivateReferralLink, type ReferralLink,
} from '@/api/employer-referrals-api';

const TEXT = COPY.employer.referrals;

const CELL: React.CSSProperties = {
  fontSize: 12, color: 'var(--ink-faint)', width: 78, flexShrink: 0, textAlign: 'right',
};

function ReferralRow({ link, onDeactivate }: {
  link: ReferralLink;
  onDeactivate: (link: ReferralLink) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
      borderTop: '1px solid var(--border)',
    }}>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 13,
        // A deactivated link stays listed — its past applications are still real —
        // but reads as retired rather than active.
        color: link.isActive ? 'var(--ink)' : 'var(--ink-faint)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {link.referrerName ?? '—'}
        {!link.isActive && (
          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--ink-faint)' }}>
            · {TEXT.deactivated}
          </span>
        )}
      </span>
      <span style={CELL}>{link.clickCount}</span>
      <span style={{ ...CELL, color: 'var(--ink)', fontWeight: 600 }}>{link.applicationCount}</span>
      <span style={{ width: 96, flexShrink: 0, textAlign: 'right' }}>
        {link.isActive && (
          <Button variant="ghost" size="sm" onClick={() => onDeactivate(link)}>
            {TEXT.deactivate}
          </Button>
        )}
      </span>
    </div>
  );
}

export default function ReferralActivityList({ postingId }: { postingId: string }) {
  const { showToast } = useToast();
  const [links, setLinks] = useState<ReferralLink[] | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const load = useCallback(async () => {
    setHasFailed(false);
    try {
      setLinks(await listReferralLinks(postingId));
    } catch {
      setHasFailed(true);
    }
  }, [postingId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDeactivate(link: ReferralLink) {
    try {
      const updated = await deactivateReferralLink(link.id);
      setLinks((current) => (current ?? []).map((row) => (row.id === updated.id ? updated : row)));
    } catch {
      showToast('error', TEXT.deactivateFailed);
    }
  }

  if (hasFailed) {
    return (
      <Card>
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{TEXT.loadFailed}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </Stack>
        </Alert>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap={10}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {TEXT.activityTitle}
        </h3>

        {links === null && <SkeletonLine />}

        {links !== null && links.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>{TEXT.activityEmpty}</p>
        )}

        {links !== null && links.length > 0 && (
          <div>
            {/* Column labels, not a <table>: three numeric columns beside a name do
                not need table semantics, and this stays legible on a phone. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {TEXT.activityColumnPerson}
              </span>
              <span style={{ ...CELL, fontWeight: 600 }}>{TEXT.activityColumnClicks}</span>
              <span style={{ ...CELL, fontWeight: 600 }}>{TEXT.activityColumnApplications}</span>
              <span style={{ width: 96, flexShrink: 0 }} />
            </div>
            {links.map((link) => (
              <ReferralRow key={link.id} link={link} onDeactivate={(row) => void handleDeactivate(row)} />
            ))}
          </div>
        )}
      </Stack>
    </Card>
  );
}
