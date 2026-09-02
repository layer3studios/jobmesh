// FILE: admin/scraper-health/parts/RunHistoryTable.tsx
// Recent scrape_runs rows with a site filter. Status is a word, not just a
// colour; a failed row shows its error message inline rather than hiding it
// behind a tooltip.

import type { ScrapeRun } from '@/types/admin-scraper-health';
import { formatTimestamp, formatDuration } from './scraper-health-format';

const TH = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
} as const;

const TD = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'top',
} as const;

interface Props {
  runs: ScrapeRun[];
  sites: string[];
  siteFilter: string;
  onSiteFilterChange: (site: string) => void;
}

export default function RunHistoryTable({ runs, sites, siteFilter, onSiteFilterChange }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <label htmlFor="run-site-filter" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          Site
        </label>
        <select
          id="run-site-filter"
          value={siteFilter}
          onChange={(event) => onSiteFilterChange(event.target.value)}
          style={{
            padding: '6px 10px', borderRadius: 8, fontSize: '0.82rem',
            border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
          }}
        >
          <option value="">All sites</option>
          {sites.map((site) => <option key={site} value={site}>{site}</option>)}
        </select>
      </div>

      {runs.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No runs recorded yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={TH} scope="col">Site</th>
                <th style={TH} scope="col">Started</th>
                <th style={TH} scope="col">Duration</th>
                <th style={TH} scope="col">Fetched</th>
                <th style={TH} scope="col">New</th>
                <th style={TH} scope="col">Expired</th>
                <th style={TH} scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={`${run.runId}-${run.siteName}`} data-testid="run-row">
                  <td style={{ ...TD, fontWeight: 600 }}>{run.siteName}</td>
                  <td style={TD}>{formatTimestamp(run.startedAt)}</td>
                  <td style={TD}>{formatDuration(run.durationMs)}</td>
                  <td style={TD}>{run.jobsFetched.toLocaleString()}</td>
                  <td style={TD}>{run.newJobs.toLocaleString()}</td>
                  <td style={TD}>{run.deletedExpired.toLocaleString()}</td>
                  <td style={{ ...TD, color: run.scrapedSuccessfully ? 'var(--ink)' : 'var(--danger)' }}>
                    {run.scrapedSuccessfully ? 'Success' : 'Failed'}
                    {!run.scrapedSuccessfully && run.errorMessage && (
                      <span style={{ display: 'block', fontSize: '0.75rem', marginTop: 2, wordBreak: 'break-word' }}>
                        {run.errorMessage}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
