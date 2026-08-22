'use client';
// FILE: src/components/admin/DpdpRightsQueue.tsx
// The DPDP erasure ops queue. Every open erasure request, oldest deadline first,
// with a Process button per row and one that drains the lot.
//
// SORTED BY DEADLINE, NOT BY ARRIVAL, and the overdue ones say so. This is a
// statutory 90-day clock, and the only question the page has to answer at a glance
// is "what is late". A queue sorted newest-first would bury exactly that.
//
// No optimistic UI: fulfil → refetch → toast, matching EmployerAccess. Erasure is
// irreversible, so a row must not disappear until the server says it did.

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  PageHeader, Stack, Card, Badge, Button, Alert, SkeletonCard, EmptyState, useToast,
} from '@/components/ui';
import {
  listOpenRightsRequests, fulfilRightsRequest, fulfilAllErasureRequests,
  type RightsRequest,
} from '@/api/admin-dpdp-api';
import { COPY } from '@/theme/brand';

const C = COPY.employer.dpdp;
type LoadState = 'loading' | 'loaded' | 'error';

const messageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);
const isOverdue = (dueBy: string) => new Date(dueBy).getTime() < Date.now();
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

/** One request. Stacks on narrow screens — the row is four facts and a button. */
function RequestRow({ request, isBusy, onProcess }: {
  request: RightsRequest; isBusy: boolean; onProcess: () => void;
}) {
  const overdue = isOverdue(request.dueBy);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{
          fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {request.contactEmail}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
          {C.columnSubmitted} {formatDate(request.submittedAt)} · {C.columnDue} {formatDate(request.dueBy)}
        </div>
      </div>
      <Badge variant="neutral" size="sm">{request.requestType}</Badge>
      {/* Stated in words, not only in colour — an overdue row must read as overdue
          to anyone, including in a greyscale screenshot pasted into a ticket. */}
      {overdue && <Badge variant="danger" size="sm">{C.overdue}</Badge>}
      <Button size="sm" variant="secondary" loading={isBusy} onClick={onProcess}>
        {C.process}
      </Button>
    </div>
  );
}

export default function DpdpRightsQueue() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RightsRequest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setRequests(await listOpenRightsRequests('erasure'));
      setLoadState('loaded');
    } catch (error) {
      setLoadState('error');
      showToast('error', messageOf(error, C.loadError));
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  async function processOne(id: string) {
    setBusyId(id);
    try {
      await fulfilRightsRequest(id);
      showToast('success', C.processed);
      await load();
    } catch (error) {
      showToast('error', messageOf(error, C.processFailed));
    } finally {
      setBusyId(null);
    }
  }

  async function processAll() {
    setIsBulkRunning(true);
    try {
      const result = await fulfilAllErasureRequests();
      // Partial success is reported as partial success — a bulk action that says
      // "done" while three rows failed is worse than one that says nothing.
      showToast(
        result.failed.length > 0 ? 'error' : 'success',
        `Fulfilled ${result.successCount} of ${result.total}`
        + (result.failed.length > 0 ? `, ${result.failed.length} failed` : '.'),
      );
      await load();
    } catch (error) {
      showToast('error', messageOf(error, C.processFailed));
    } finally {
      setIsBulkRunning(false);
    }
  }

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={4} />;
    if (loadState === 'error') {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{C.loadError}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>{COPY.employer.common.retry}</Button>
          </Stack>
        </Alert>
      );
    }
    if (requests.length === 0) {
      return <EmptyState heading={C.queueEmpty} description={C.queueEmptyBody} icon={<ShieldCheck size={20} />} />;
    }
    return (
      <Stack gap={0}>
        {requests.map((request) => (
          <RequestRow
            key={request.id}
            request={request}
            isBusy={busyId === request.id || isBulkRunning}
            onProcess={() => void processOne(request.id)}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap={16}>
      <PageHeader
        title={C.queueTitle}
        subtitle={C.queueSubtitle}
        actions={requests.length > 0 ? (
          <Button size="sm" loading={isBulkRunning} onClick={() => void processAll()}>
            {C.processAll}
          </Button>
        ) : undefined}
      />
      <Card>{renderBody()}</Card>
    </Stack>
  );
}
