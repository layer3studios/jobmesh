// FILE: admin/companies/parts/CompanyHealthTable.tsx
// Sortable company table. Sorting is client-side: this is a handful of rows and
// a round trip per header click would be worse than the sort is expensive.
//
// Status is a WORD ('Dormant'/'Quiet'/'Active') with colour behind it, never
// colour alone.

import type { CompanyHealthRow, CompanyHealthStatus } from '@/types/admin-company-health';
import { relativeTime } from '../../parts/mission-format';

export type SortKey =
  | 'name' | 'memberCount' | 'livePostingCount' | 'totalApplicants'
  | 'applicantsLast30d' | 'lastMemberLoginAt' | 'lastActivityAt' | 'status';

const TH_BUTTON = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  font: 'inherit', color: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit',
} as const;

const TH = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
} as const;

const TD = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'top',
} as const;

const STATUS_TONE: Record<CompanyHealthStatus, string> = {
  active: 'var(--cat-green)',
  quiet: 'var(--cat-amber)',
  dormant: 'var(--danger)',
};

const STATUS_WORD: Record<CompanyHealthStatus, string> = {
  active: 'Active',
  quiet: 'Quiet',
  dormant: 'Dormant',
};

function StatusBadge({ status }: { status: CompanyHealthStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
      color: tone, border: `1px solid ${tone}`, background: 'transparent',
    }}>
      {STATUS_WORD[status]}
    </span>
  );
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Company' },
  { key: 'memberCount', label: 'Members' },
  { key: 'livePostingCount', label: 'Live postings' },
  { key: 'totalApplicants', label: 'Applicants' },
  { key: 'applicantsLast30d', label: 'Last 30d' },
  { key: 'lastMemberLoginAt', label: 'Last login' },
  { key: 'lastActivityAt', label: 'Last activity' },
  { key: 'status', label: 'Status' },
];

interface Props {
  companies: CompanyHealthRow[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  now?: Date;
}

export default function CompanyHealthTable({ companies, sortKey, sortAsc, onSort, now }: Props) {
  if (companies.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No companies yet.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                style={TH}
                scope="col"
                aria-sort={sortKey === column.key ? (sortAsc ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" style={TH_BUTTON} onClick={() => onSort(column.key)}>
                  {column.label}{sortKey === column.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.companyId} data-testid="company-row">
              <td style={{ ...TD, fontWeight: 600 }}>{company.name ?? '—'}</td>
              <td style={TD}>{company.memberCount.toLocaleString()}</td>
              <td style={TD}>{company.livePostingCount.toLocaleString()}</td>
              <td style={TD}>{company.totalApplicants.toLocaleString()}</td>
              <td style={TD}>{company.applicantsLast30d.toLocaleString()}</td>
              <td style={TD} title={company.lastMemberLoginAt ?? 'never'}>
                {relativeTime(company.lastMemberLoginAt, now)}
              </td>
              <td style={TD} title={company.lastActivityAt ?? 'never'}>
                {relativeTime(company.lastActivityAt, now)}
              </td>
              <td style={TD}><StatusBadge status={company.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
