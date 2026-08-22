// FILE: src/app/(seeker)/status/parts/status-helpers.ts
// Presentation helpers for the public status page. Pure functions — the page
// stays a Server Component and these stay unit-testable.

/** Health payload as returned by the backend (and proxied by /api/health). */
export type HealthServiceStatus = { status?: string } & Record<string, unknown>;

export type HealthReport = {
  status?: string;
  timestamp?: string;
  version?: string;
  uptime?: number;
  environment?: string;
  services?: Record<string, HealthServiceStatus>;
};

/** Traffic-light colour per service state. Unknown states read as amber. */
export type StatusTone = 'ok' | 'warn' | 'down';

const OK_STATES = ['healthy', 'connected', 'configured', 'available', 'running'];
const DOWN_STATES = ['degraded', 'disconnected', 'unreachable', 'error', 'down'];

export function toneFor(status: string | undefined): StatusTone {
  if (!status) return 'warn';
  const value = status.toLowerCase();
  if (OK_STATES.includes(value)) return 'ok';
  if (DOWN_STATES.includes(value)) return 'down';
  return 'warn';
}

export const TONE_COLOR: Record<StatusTone, string> = {
  ok: 'var(--success)',
  warn: 'var(--warning)',
  down: 'var(--danger)',
};

/** 'not_configured' → 'Not configured'. Keeps raw backend states readable. */
export function humanizeStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  const spaced = status.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** camelCase / snake_case service key → 'Database', 'Resume parse queue'. */
export function humanizeServiceName(key: string): string {
  const spaced = key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Seconds → '5 days, 3 hours'. Falls back through hours, minutes, seconds. */
export function formatUptime(seconds: number | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return 'Unknown';
  const units: Array<[string, number]> = [
    ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  const parts: string[] = [];
  let remaining = Math.floor(seconds);
  for (const [name, size] of units) {
    const count = Math.floor(remaining / size);
    remaining -= count * size;
    if (count > 0) parts.push(`${count} ${name}${count === 1 ? '' : 's'}`);
    if (parts.length === 2) break;
  }
  return parts.length ? parts.join(', ') : '0 seconds';
}

/** Headline copy driven by the worst service state on the page. */
export function overallHeadline(report: HealthReport): { tone: StatusTone; label: string } {
  const services = Object.values(report.services ?? {});
  const tones = services.map((service) => toneFor(service?.status));
  if (toneFor(report.status) === 'down' || tones.includes('down')) {
    return { tone: 'down', label: 'Some systems are degraded' };
  }
  if (tones.includes('warn')) return { tone: 'warn', label: 'Partially operational' };
  return { tone: 'ok', label: 'All systems operational' };
}
