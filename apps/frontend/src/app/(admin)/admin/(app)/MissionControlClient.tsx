'use client';
// FILE: admin/MissionControlClient.tsx
// The admin home page. Replaces the old redirect to employer-access.
//
// Re-polls every 60s because the status strip is a live view of the DB, the
// queues and the AI budget. A poll must never blank the page: refreshes keep
// the last good payload on screen and only the first load shows skeletons.

import { useCallback, useEffect, useState } from 'react';
import { fetchMissionControl } from '@/api/admin-mission-control-api';
import type { MissionControlPayload } from '@/types/admin-mission-control';
import KpiTile from './analytics/parts/KpiTile';
import SparklineCard from './analytics/parts/SparklineCard';
import SystemStatusStrip from './parts/SystemStatusStrip';
import { deltaWording } from './parts/mission-format';

const POLL_INTERVAL_MS = 60_000;

const SECTION_TITLE = {
  margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)',
} as const;

/** Movement stated as arrow + word, never colour alone. */
function DeltaLine({ delta, noun }: { delta: number; noun: string }) {
  const { word, arrow } = deltaWording(delta);
  const tone = word === 'up' ? 'var(--cat-green)' : word === 'down' ? 'var(--danger)' : 'var(--ink-muted)';
  return (
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: tone }}>
      {arrow} {word === 'flat' ? 'flat' : `${word} ${Math.abs(delta).toLocaleString()}`} {noun}
    </span>
  );
}

function Skeletons() {
  return (
    <div data-testid="mission-control-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="anim-pulse" style={{ height: 110, borderRadius: 12, background: 'var(--paper-2)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="anim-pulse" style={{ height: 90, borderRadius: 12, background: 'var(--paper-2)' }} />
        ))}
      </div>
    </div>
  );
}

export default function MissionControlClient() {
  const [payload, setPayload] = useState<MissionControlPayload | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setError(false);
    try {
      setPayload(await fetchMissionControl());
      setError(false);
    } catch {
      // A failed background poll keeps the last good data on screen.
      if (!silent) setError(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => { void load({ silent: true }); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const overview = payload?.overview;
  const totals = overview?.totals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Mission Control</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Platform health at a glance. Refreshes every 60s.
        </p>
      </div>

      {error && !payload && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load the overview.</span>
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

      {!payload && !error && <Skeletons />}

      {payload && overview && totals && (
        <>
          <section style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px',
          }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase', color: 'var(--ink-faint)',
            }}>
              Applications this week
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.05, marginTop: 4 }}>
              {overview.newApplications.thisWeek.toLocaleString()}
            </div>
            <div style={{ marginTop: 6 }}>
              <DeltaLine delta={overview.newApplications.delta} noun="vs last week" />
              <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginLeft: 8 }}>
                ({overview.newApplications.prevWeek.toLocaleString()} last week)
              </span>
            </div>
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Platform</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <KpiTile
                label="Seekers"
                value={totals.seekers}
                hint={`${overview.newSeekers.thisWeek} new this week`}
              />
              <KpiTile label="Employer users" value={totals.employers} />
              <KpiTile label="Companies" value={totals.companies} />
              <KpiTile
                label="Live postings"
                value={totals.livePostings}
                hint={`${overview.newPostings.thisWeek} new this week`}
              />
              <KpiTile label="Scraped jobs" value={totals.scrapedJobs} />
            </div>
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Applications · last 8 weeks</h2>
            <SparklineCard
              title="Applications per week"
              data={overview.weeklyApplications.map((point) => ({
                date: point.weekStart.slice(0, 10),
                count: point.count,
              }))}
            />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>System status</h2>
            <SystemStatusStrip status={payload.status} />
          </section>
        </>
      )}
    </div>
  );
}
