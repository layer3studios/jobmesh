'use client';
// FILE: admin/companies/CompaniesClient.tsx
// Company health table. Read-only — this page has no actions.
//
// The default sort is deliberately worst-first: dormant companies, then by
// oldest activity. The point of the page is to find the ones going quiet, so
// they should not be somewhere on page two.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCompanyHealth } from '@/api/admin-company-health-api';
import type { CompanyHealthRow, CompanyHealthStatus } from '@/types/admin-company-health';
import CompanyHealthTable, { type SortKey } from './parts/CompanyHealthTable';

/** Worst first: dormant, then quiet, then active. */
const STATUS_RANK: Record<CompanyHealthStatus, number> = { dormant: 0, quiet: 1, active: 2 };

function Skeletons() {
  return (
    <div data-testid="companies-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 44, borderRadius: 10, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

/** Nulls always sort last: "never" is the worst value, not the smallest. */
function compare(a: CompanyHealthRow, b: CompanyHealthRow, key: SortKey): number {
  if (key === 'status') return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (key === 'name') return (a.name ?? '').localeCompare(b.name ?? '');
  if (key === 'lastMemberLoginAt' || key === 'lastActivityAt') {
    const left = a[key] ? new Date(a[key] as string).getTime() : null;
    const right = b[key] ? new Date(b[key] as string).getTime() : null;
    if (left === null && right === null) return 0;
    if (left === null) return -1;   // never-active sorts to the "worst" end
    if (right === null) return 1;
    return left - right;
  }
  return (a[key] as number) - (b[key] as number);
}

export default function CompaniesClient() {
  const [companies, setCompanies] = useState<CompanyHealthRow[] | null>(null);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('lastActivityAt');
  const [sortAsc, setSortAsc] = useState(true);

  const load = useCallback(async () => {
    setError(false);
    try {
      setCompanies(await fetchCompanyHealth());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((current) => {
      if (current === key) {
        setSortAsc((asc) => !asc);
        return current;
      }
      // A new column starts ascending: oldest / smallest first, which is the
      // "needs attention" end for every column on this page.
      setSortAsc(true);
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!companies) return [];
    const rows = [...companies];
    rows.sort((a, b) => {
      // Default view leads with status so dormant companies surface first;
      // an explicit column choice takes over entirely.
      if (sortKey === 'lastActivityAt') {
        const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        if (byStatus !== 0) return byStatus;
      }
      const result = compare(a, b, sortKey);
      return sortAsc ? result : -result;
    });
    return rows;
  }, [companies, sortKey, sortAsc]);

  const dormantCount = companies?.filter((company) => company.status === 'dormant').length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Companies</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          {companies
            ? `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} · ${dormantCount} dormant`
            : 'Loading…'}
        </p>
      </div>

      {error && !companies && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load companies.</span>
          <button
            type="button" onClick={() => void load()}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!companies && !error && <Skeletons />}

      {companies && (
        <CompanyHealthTable
          companies={sorted}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
