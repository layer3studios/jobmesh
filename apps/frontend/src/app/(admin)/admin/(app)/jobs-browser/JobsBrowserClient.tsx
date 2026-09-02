'use client';
// FILE: admin/jobs-browser/JobsBrowserClient.tsx
// Search and moderation over the whole jobs corpus.
//
// Mutate → refetch → toast, no optimistic UI: hide and delete both change what
// candidates can see, and a row that claims to be hidden when the write failed
// is exactly the wrong thing to believe. Delete is scraped-only and the server
// enforces it — the UI only declines to offer it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal, useToast } from '@/components/ui';
import {
  searchJobs, fetchSites, fetchJob, setJobHidden, deleteJob, JobBrowserApiError,
} from '@/api/admin-job-browser-api';
import type {
  JobRow, JobDetail, JobSourceFilter, HiddenFilter,
} from '@/types/admin-job-browser';
import JobResultsTable from './parts/JobResultsTable';
import DeleteJobModal from './parts/DeleteJobModal';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const CONTROL = {
  padding: '7px 10px', borderRadius: 8, fontSize: '0.85rem',
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
} as const;

function Skeletons() {
  return (
    <div data-testid="jobs-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 44, borderRadius: 10, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function JobsBrowserClient() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [source, setSource] = useState<JobSourceFilter>('all');
  const [site, setSite] = useState('');
  const [hidden, setHidden] = useState<HiddenFilter>('exclude');
  const [skip, setSkip] = useState(0);

  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [sites, setSites] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JobRow | null>(null);
  const [pendingHide, setPendingHide] = useState<JobRow | null>(null);

  // Debounce typing so a search is one request per pause, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setSkip(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const filtersRef = useRef({ debouncedQuery, source, site, hidden, skip });
  filtersRef.current = { debouncedQuery, source, site, hidden, skip };

  const load = useCallback(async () => {
    setError(false);
    try {
      const current = filtersRef.current;
      const result = await searchJobs({
        q: current.debouncedQuery || undefined,
        source: current.source,
        site: current.site || undefined,
        hidden: current.hidden,
        limit: PAGE_SIZE,
        skip: current.skip,
      });
      setJobs(result.jobs);
      setTotal(result.total);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load, debouncedQuery, source, site, hidden, skip]);

  useEffect(() => {
    fetchSites().then(setSites).catch(() => setSites([]));
  }, []);

  const openDetail = useCallback(async (jobId: string) => {
    if (expandedId === jobId) { setExpandedId(null); return; }
    setExpandedId(jobId);
    setDetail(null);
    setIsDetailLoading(true);
    try {
      setDetail(await fetchJob(jobId));
    } catch {
      showToast('error', 'Could not load that job');
      setExpandedId(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [expandedId, showToast]);

  const applyHidden = useCallback(async (job: JobRow) => {
    setBusyJobId(job.id);
    try {
      await setJobHidden(job.id, !job.isHidden);
      await load();
      if (expandedId === job.id) setDetail(await fetchJob(job.id));
      showToast('success', job.isHidden ? 'Job unhidden' : 'Job hidden from seeker pages');
    } catch {
      showToast('error', 'Could not update that job');
    } finally {
      setBusyJobId(null);
      setPendingHide(null);
    }
  }, [load, expandedId, showToast]);

  /** Hiding removes a job from candidate-facing pages, so it confirms first;
   *  unhiding restores visibility and needs no ceremony. */
  const handleToggleHidden = useCallback((job: JobRow) => {
    if (job.isHidden) void applyHidden(job);
    else setPendingHide(job);
  }, [applyHidden]);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const job = pendingDelete;
    setBusyJobId(job.id);
    try {
      await deleteJob(job.id);
      setPendingDelete(null);
      setExpandedId(null);
      setDetail(null);
      await load();
      showToast('success', 'Job deleted');
    } catch (err) {
      // The server refuses native postings even if the UI ever offered it.
      const message = err instanceof JobBrowserApiError && err.code === 'native_posting'
        ? 'Employer postings cannot be deleted'
        : 'Could not delete that job';
      showToast('error', message);
      setPendingDelete(null);
    } finally {
      setBusyJobId(null);
    }
  }, [pendingDelete, load, showToast]);

  const pageStart = total === 0 ? 0 : skip + 1;
  const pageEnd = Math.min(skip + PAGE_SIZE, total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Jobs</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          {jobs ? `${total.toLocaleString()} matching ${total === 1 ? 'job' : 'jobs'}` : 'Loading…'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or company…"
          aria-label="Search jobs"
          style={{ ...CONTROL, flex: '1 1 240px', minWidth: 200 }}
        />
        <select
          value={source} aria-label="Source"
          onChange={(event) => { setSource(event.target.value as JobSourceFilter); setSkip(0); }}
          style={CONTROL}
        >
          <option value="all">All sources</option>
          <option value="scraped">Scraped</option>
          <option value="native">Employer postings</option>
        </select>
        <select
          value={site} aria-label="Site"
          onChange={(event) => { setSite(event.target.value); setSkip(0); }}
          style={CONTROL}
        >
          <option value="">All sites</option>
          {sites.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select
          value={hidden} aria-label="Hidden"
          onChange={(event) => { setHidden(event.target.value as HiddenFilter); setSkip(0); }}
          style={CONTROL}
        >
          <option value="exclude">Exclude hidden</option>
          <option value="only">Only hidden</option>
          <option value="all">All</option>
        </select>
      </div>

      {error && !jobs && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load jobs.</span>
          <button type="button" onClick={() => void load()} style={{ ...CONTROL, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!jobs && !error && <Skeletons />}

      {jobs && (
        <>
          <JobResultsTable
            jobs={jobs}
            expandedId={expandedId}
            detail={detail}
            isDetailLoading={isDetailLoading}
            busyJobId={busyJobId}
            onToggleExpand={(jobId) => void openDetail(jobId)}
            onToggleHidden={handleToggleHidden}
            onRequestDelete={setPendingDelete}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button" style={{ ...CONTROL, cursor: skip === 0 ? 'default' : 'pointer' }}
              disabled={skip === 0}
              onClick={() => { setExpandedId(null); setSkip(Math.max(0, skip - PAGE_SIZE)); }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              {pageStart}–{pageEnd} of {total.toLocaleString()}
            </span>
            <button
              type="button" style={{ ...CONTROL, cursor: pageEnd >= total ? 'default' : 'pointer' }}
              disabled={pageEnd >= total}
              onClick={() => { setExpandedId(null); setSkip(skip + PAGE_SIZE); }}
            >
              Next
            </button>
          </div>
        </>
      )}

      <Modal
        isOpen={pendingHide !== null}
        onClose={() => setPendingHide(null)}
        title="Hide this job from seekers?"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setPendingHide(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={busyJobId !== null}
              onClick={() => { if (pendingHide) void applyHidden(pendingHide); }}
            >
              Hide it
            </Button>
          </>
        )}
      >
        Removes this job from all seeker-facing pages — search, the feed, facets and
        its detail page. Nothing is deleted, and you can unhide it at any time.
      </Modal>

      <DeleteJobModal
        job={pendingDelete}
        isBusy={busyJobId === pendingDelete?.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
