'use client';
// FILE: src/components/employer/jobs/JobsList.tsx
// Employer postings list. Refetches on every mount and on tab change — no client
// cache (R1); a Refresh button forces an explicit refetch. Empty and error
// states are distinct screens (R2). 'All' sends no status param (R3).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, RefreshCw } from 'lucide-react';
import {
  Container, Button, Alert, PageHeader, Stack, Tabs, EmptyState, SkeletonCard, useToast,
} from '@/components/ui';
import type { TabItem } from '@/components/ui';
import JobsTable from '@/components/employer/jobs/JobsTable';
import PostingFillDialog from '@/components/employer/jobs/parts/PostingFillDialog';
import { listEmployerPostings, fillEmployerPosting, EmployerJobsApiError } from '@/api/employer-jobs-api';
import type { Posting, PostingStatus } from '@/types/employer-jobs';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canCreatePosting, canEditPosting, canClosePosting, canEditCompanySettings } from '@/lib/team-permissions';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';
import { COPY } from '@/theme/brand';

type StatusFilter = 'all' | PostingStatus;
type LoadState = 'loading' | 'loaded' | 'error';

const STATUS_TABS: TabItem[] = [
  { id: 'all', label: COPY.employer.jobs.tabAll, content: null },
  { id: 'active', label: COPY.employer.jobs.statusActive, content: null },
  { id: 'draft', label: COPY.employer.jobs.statusDraft, content: null },
  { id: 'closed', label: COPY.employer.jobs.statusClosed, content: null },
];
const LOAD_ERROR_MESSAGE = COPY.employer.jobs.loadError;

export default function JobsList() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [postings, setPostings] = useState<Posting[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string | null>(null);
  // UX gates — the backend still enforces every one of these. Unknown role → allow.
  const { viewerRole } = useEmployer();
  const allowCreate = viewerRole ? canCreatePosting(viewerRole) : true;
  const allowEdit = viewerRole ? canEditPosting(viewerRole) : true;
  const allowClose = viewerRole ? canClosePosting(viewerRole) : true;
  // Deleting is Owner+ while closing is Member+: closing is reversible, this is not.
  const allowDelete = viewerRole ? canEditCompanySettings(viewerRole) : false;
  const [fillTarget, setFillTarget] = useState<Posting | null>(null);
  const { showToast } = useToast();
  const [isFilling, setIsFilling] = useState(false);

  const handleFill = async () => {
    if (!fillTarget) return;
    setIsFilling(true);
    try {
      const result = await fillEmployerPosting(fillTarget.id);
      const word = result.archivedCount === 1 ? 'candidate' : 'candidates';
      showToast('success', `Posting closed. ${result.archivedCount} ${word} archived.`);
      setFillTarget(null);
      void load(activeStatus);
    } catch (error) {
      showToast('error', error instanceof EmployerJobsApiError ? error.message : 'Could not close the posting.');
    } finally {
      setIsFilling(false);
    }
  };

  const load = useCallback(async (status: StatusFilter) => {
    setLoadState('loading');
    try {
      const result = await listEmployerPostings(status === 'all' ? {} : { status });
      setPostings(result);
      setLastError(null);
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerJobsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, []);

  useEffect(() => { void load(activeStatus); }, [activeStatus, load]);

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={4} />;
    if (loadState === 'error') {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={() => void load(activeStatus)}>{COPY.employer.common.retry}</Button>
          </Stack>
        </Alert>
      );
    }
    if (!postings || postings.length === 0) {
      return activeStatus === 'all' ? (
        <EmptyState
          icon={<Briefcase size={28} aria-hidden />}
          title={COPY.employer.jobs.emptyTitle}
          description={COPY.employer.jobs.emptyBody}
          action={allowCreate ? (
            <Link href={withOrigin('/employer/jobs/new', NAV_ORIGINS.JOBS)}>
              <Button variant="primary">+ {COPY.employer.jobs.newPosting}</Button>
            </Link>
          ) : undefined}
        />
      ) : (
        <EmptyState
          title={COPY.employer.jobs.emptyStatusTitle}
          description={COPY.employer.jobs.emptyStatusBody}
        />
      );
    }
    return (
      <JobsTable
        postings={postings}
        canEdit={allowEdit}
        canClose={allowClose}
        canDelete={allowDelete}
        onFill={setFillTarget}
        onChanged={() => void load(activeStatus)}
      />
    );
  }

  return (
    <Container size="full" style={{ padding: '32px 16px 60px' }}>
      <PageHeader
        label={COPY.employer.jobs.pageLabel}
        title={COPY.employer.jobs.pageTitle}
        actions={allowCreate ? (
          <Link href={withOrigin('/employer/jobs/new', NAV_ORIGINS.JOBS)}>
            <Button variant="primary">+ {COPY.employer.jobs.newPosting}</Button>
          </Link>
        ) : undefined}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, minWidth: 200 }}>
          <Tabs
            tabs={STATUS_TABS}
            defaultTabId="all"
            variant="pill"
            onChange={(id) => setActiveStatus(id as StatusFilter)}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<RefreshCw size={14} aria-hidden />}
          onClick={() => void load(activeStatus)}
        >
          {COPY.employer.jobs.refresh}
        </Button>
      </div>
      <div style={{ marginTop: 8 }}>{renderBody()}</div>

      {/* "Position filled" is the one row action that also archives people, so it
          keeps the same dedicated confirm the posting detail page uses. */}
      <PostingFillDialog
        isOpen={fillTarget != null}
        candidateCount={fillTarget?.applicantCount ?? 0}
        isMutating={isFilling}
        onCancel={() => setFillTarget(null)}
        onConfirm={() => { void handleFill(); }}
      />
    </Container>
  );
}
