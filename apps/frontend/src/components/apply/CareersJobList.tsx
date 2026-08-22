'use client';
// FILE: src/components/apply/CareersJobList.tsx
// The open-roles list: search, location chips, and the role rows themselves.
//
// SIGNATURE — the right-hand rail. Posted-recency sits in a fixed, tabular,
// right-aligned column instead of inline in the meta line, so scanning the list
// answers "is this company actually posting, and what will applying cost me"
// without reading a single row in full. The take-home badge shares that rail for
// the same reason: cost belongs next to recency, not buried in prose.

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import AssignmentBadge from './AssignmentBadge';
import { postedAgo, isStale, distinctLocations, filterJobs } from './careers-helpers';
import type { PublicJobSummary, PublicSocialLinks } from '@/types/public-apply';
import SocialLinks from './SocialLinks';

// A single "All" chip is a control that cannot change anything, so the row only
// earns its space once there are at least two real locations to switch between.
const MINIMUM_LOCATIONS_FOR_CHIPS = 2;

export default function CareersJobList({
  jobs, companySlug, companyName, socialLinks,
}: {
  jobs: PublicJobSummary[];
  companySlug: string;
  companyName: string;
  socialLinks: PublicSocialLinks | null;
}) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<string | null>(null);
  // useDeferredValue instead of a setTimeout debounce: it keeps the input itself
  // perfectly responsive and lets React drop superseded filter passes, with no
  // timer to clear on unmount and no fixed delay that is wrong on fast machines.
  const deferredQuery = useDeferredValue(query);

  const locations = useMemo(() => distinctLocations(jobs), [jobs]);
  const visible = useMemo(
    () => filterJobs(jobs, { query: deferredQuery, location }),
    [jobs, deferredQuery, location],
  );

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No open positions right now"
        description="Check back soon."
        action={socialLinks ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Follow {companyName} for updates</span>
            <SocialLinks links={socialLinks} companyName={companyName} />
          </div>
        ) : undefined}
      />
    );
  }

  return (
    <div>
      <div className="careers-filter-row" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          Open roles ({jobs.length})
        </h2>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search roles"
          aria-label="Search roles by title"
          style={{
            fontSize: 13, padding: '7px 11px', borderRadius: 8, minWidth: 200,
            border: '0.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)',
          }}
        />
      </div>

      {locations.length >= MINIMUM_LOCATIONS_FOR_CHIPS && (
        <div className="careers-chip-row" style={{ marginBottom: 12 }}>
          <button type="button" className="careers-chip" aria-pressed={location === null} onClick={() => setLocation(null)}>
            All
          </button>
          {locations.map((name) => (
            <button
              key={name}
              type="button"
              className="careers-chip"
              aria-pressed={location === name}
              onClick={() => setLocation(location === name ? null : name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '16px 0' }}>
          No roles match that search.
        </p>
      ) : (
        <div className="careers-role-list">
          {visible.map((job) => {
            const posted = postedAgo(job.postedAt);
            return (
              <Link
                key={job.id}
                // ?source=careers tells the backend this application began on the
                // company's own careers page rather than an aggregator.
                href={`/apply/${companySlug}/${job.slug}?source=careers`}
                className="careers-role"
              >
                <span className="careers-role-main">
                  <span className="careers-role-title" style={{ display: 'block' }}>{job.title}</span>
                  <span className="careers-role-meta">
                    <span>{[job.location, job.employmentType].filter(Boolean).join(' · ')}</span>
                    {job.workplaceType && (
                      <span className="careers-workplace-badge">{job.workplaceType}</span>
                    )}
                  </span>
                </span>
                <span className="careers-role-rail">
                  {job.assignment && (
                    <AssignmentBadge estimatedHours={job.assignment.estimatedHours} size="sm" />
                  )}
                  {posted && (
                    <span className="careers-posted" data-stale={isStale(job.postedAt)}>{posted}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
