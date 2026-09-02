// FILE: admin/parts/SystemStatusStrip.tsx
// The live system strip. Every bad state is a WORD ("Stale", "Stalled",
// "Down", "Low", "N failed") next to the colour, so nothing depends on colour
// alone. Each item links to the page that can actually explain it.

import Link from 'next/link';
import type { SystemStatus } from '@/types/admin-mission-control';
import {
  relativeTime, isScraperStale, formatBytes, DISK_LOW_BYTES, QUEUE_STALL_MS,
} from './mission-format';

const ITEM = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
  padding: '10px 12px', minWidth: 0, textDecoration: 'none', display: 'block',
} as const;

const LABEL = {
  fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)',
} as const;

function StatusItem({ label, value, bad, href }: {
  label: string; value: string; bad: boolean; href?: string;
}) {
  const body = (
    <>
      <div style={LABEL}>{label}</div>
      <div style={{
        fontSize: '0.85rem', fontWeight: 600, marginTop: 3,
        color: bad ? 'var(--danger)' : 'var(--ink)',
      }}>
        {value}
      </div>
    </>
  );
  const style = { ...ITEM, borderColor: bad ? 'var(--danger)' : 'var(--border)' };
  return href
    ? <Link href={href} style={style}>{body}</Link>
    : <div style={style}>{body}</div>;
}

export default function SystemStatusStrip({ status, now }: { status: SystemStatus; now?: Date }) {
  const scraperStale = isScraperStale(status.scraperLastSuccessAt, now);
  const models = status.ai?.models ?? [];
  const exhausted = models.filter((model) => model.keys.every((key) => key.exhausted)).length;
  const diskLow = status.diskFreeBytes !== null && status.diskFreeBytes < DISK_LOW_BYTES;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
      <StatusItem
        label="Database"
        value={status.dbOk ? 'Connected' : 'Down'}
        bad={!status.dbOk}
      />

      <StatusItem
        label="Scraper"
        value={`${relativeTime(status.scraperLastSuccessAt, now)}${scraperStale ? ' · Stale' : ''}`}
        bad={scraperStale}
        href="/admin/scraper-health"
      />

      {status.queues.map((queue) => {
        const stalled = queue.oldestPendingAgeMs !== null && queue.oldestPendingAgeMs > QUEUE_STALL_MS;
        const failed = queue.failedCount > 0;
        const parts = [
          failed ? `${queue.failedCount} failed` : null,
          stalled ? 'Stalled' : null,
        ].filter(Boolean);
        return (
          <StatusItem
            key={queue.key}
            label={queue.label}
            value={parts.length > 0 ? parts.join(' · ') : 'Healthy'}
            bad={failed || stalled}
            href="/admin/queues"
          />
        );
      })}

      <StatusItem
        label="AI models"
        value={models.length === 0
          ? 'No snapshot'
          : `${models.length} live${exhausted > 0 ? ` · ${exhausted} exhausted` : ''}`}
        bad={exhausted > 0}
        href="/admin/ai-usage"
      />

      {status.diskFreeBytes !== null && (
        <StatusItem
          label="Disk free"
          value={`${formatBytes(status.diskFreeBytes)}${diskLow ? ' · Low' : ''}`}
          bad={diskLow}
        />
      )}
    </div>
  );
}
