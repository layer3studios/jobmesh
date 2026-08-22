// FILE: src/app/(admin)/admin/analytics/parts/SectionHeader.tsx
// Section title with a right-aligned "Refreshed N ago" line derived from the section's
// cachedAt (the backend caches results ~5 min, so this tells the admin how stale the
// numbers are). Server-safe: the relative string is computed from a stable `now` the
// caller can pass; defaults to render-time (fine for a server-rendered page).
function relativeFromNow(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'just now';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default function SectionHeader({ title, cachedAt }: { title: string; cachedAt: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap', marginBottom: 10, marginTop: 24,
    }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{title}</h2>
      <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
        Refreshed {relativeFromNow(cachedAt)}
      </span>
    </div>
  );
}
