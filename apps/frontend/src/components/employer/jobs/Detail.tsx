'use client';
// FILE: src/components/employer/jobs/Detail.tsx
// Posting detail page. Fetches the posting by :postingId on mount and renders the
// Settings, Pipeline and Ranked tabs (all live). The initial tab honours a ?tab=
// query param (P1.4) so a "Back to posting" link can return the user to where they
// were. Loading / error / not-found states are distinct; not-found does NOT
// auto-redirect (R5) so a stale bookmark is explained rather than silently bounced.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Container, Card, Button, Alert, Stack, Tabs, SkeletonCard,
} from '@/components/ui';
import type { TabItem } from '@/components/ui';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import DetailSettings from '@/components/employer/jobs/DetailSettings';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import PipelineTab from '@/components/employer/jobs/PipelineTab';
import RankedTab from '@/components/employer/jobs/RankedTab';
import { getEmployerPosting, EmployerJobsApiError } from '@/api/employer-jobs-api';
import { getInterviewTimeCount } from '@/api/employer-interview-times-api';
import { Badge } from '@/components/ui';
import type { Posting } from '@/types/employer-jobs';

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';
const LOAD_ERROR_MESSAGE = 'Could not load this posting.';

// No magic strings for tab ids (C2) — shared with the ?tab query-param plumbing.
// Existing ?tab=pipeline / ?tab=ranked / ?tab=settings links stay valid.
const TAB_IDS = { OVERVIEW: 'overview', SETTINGS: 'settings', PIPELINE: 'pipeline', RANKED: 'ranked' } as const;
const VALID_TAB_IDS: string[] = Object.values(TAB_IDS);

/** Settings tab label with a low-pool nudge: red "0", amber "1", nothing at 2+. */
function settingsTabLabel(availableCount: number | null) {
  if (availableCount === null || availableCount >= 2) return 'Settings';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      Settings
      <Badge variant={availableCount === 0 ? 'danger' : 'warning'}>{availableCount}</Badge>
    </span>
  );
}

export function PostingDetail({ postingId }: { postingId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabFromUrl = searchParams.get('tab');
  // Overview first: the title + JD is what an employer expects on click-in;
  // Pipeline and Ranked are one click away.
  const defaultTabId = tabFromUrl && VALID_TAB_IDS.includes(tabFromUrl) ? tabFromUrl : TAB_IDS.OVERVIEW;

  // Mirror the active tab into ?tab= so a refresh, a bookmark and — critically —
  // the browser BACK button all land on the tab the user was actually using.
  // replace(), not push(): flipping tabs must not stack history entries.
  // Other params (?from=) are preserved so the nav origin survives a tab switch.
  const handleTabChange = useCallback((tabId: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);
  const [posting, setPosting] = useState<Posting | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [availableCount, setAvailableCount] = useState<number | null>(null);

  const loadPosting = useCallback(async () => {
    if (!postingId) return;
    setLoadState('loading');
    try {
      const result = await getEmployerPosting(postingId);
      setPosting(result);
      setLoadState('loaded');
    } catch (error) {
      if (error instanceof EmployerJobsApiError && error.status === 404) {
        setLoadState('not_found');
        return;
      }
      setLastError(error instanceof EmployerJobsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void loadPosting(); }, [loadPosting]);

  // Pool count feeds the Settings tab's low-availability badge. Best-effort:
  // a failed load just means no badge.
  useEffect(() => {
    if (!postingId) return;
    getInterviewTimeCount(postingId)
      .then((count) => setAvailableCount(count.availableCount))
      .catch(() => setAvailableCount(null));
  }, [postingId]);

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={4} />;
    if (loadState === 'not_found') {
      return (
        <Card>
          <Stack gap={14}>
            <Alert type="error">
              Posting not found. It may have been deleted, or you may not have access to it.
            </Alert>
            <div>
              <Link href="/employer/jobs"><Button variant="secondary">Back to postings</Button></Link>
            </div>
          </Stack>
        </Card>
      );
    }
    if (loadState === 'error' || !posting) {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadPosting()}>Retry</Button>
          </Stack>
        </Alert>
      );
    }

    // Overview (the JD) leads; Pipeline/Ranked are the working surfaces;
    // Settings (rare configuration) sits last, with the low-pool badge.
    const tabs: TabItem[] = [
      { id: TAB_IDS.OVERVIEW, label: 'Overview', content: <PostingOverview posting={posting} onReload={loadPosting} /> },
      { id: TAB_IDS.PIPELINE, label: 'Pipeline', content: <PipelineTab postingId={posting.id} /> },
      { id: TAB_IDS.RANKED, label: 'Ranked', content: <RankedTab postingId={posting.id} /> },
      { id: TAB_IDS.SETTINGS, label: settingsTabLabel(availableCount), content: <DetailSettings posting={posting} /> },
    ];
    return <Tabs tabs={tabs} defaultTabId={defaultTabId} onChange={handleTabChange} compact />;
  }

  return (
    <Container size="full" style={{ padding: '24px 16px' }}>
      {/* The breadcrumb carries the posting title — no separate page title (it
          would duplicate both the crumb and the form's title field on edit). */}
      <Breadcrumbs items={[{ label: 'Jobs', href: '/employer/jobs' }, { label: posting?.title ?? 'Posting' }]} />
      {renderBody()}
    </Container>
  );
}

export default PostingDetail;
