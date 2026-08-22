'use client';
// FILE: src/app/(admin)/admin/(app)/analytics/parts/TimeRangeSelector.tsx
// Segmented control for the dashboard time window. Selecting a range calls onSelect;
// the parent (AdminAnalyticsClient) fetches client-side and caches per range. While a
// fetch is in flight for the viewed range, isChanging disables the buttons (the active
// one keeps its highlight so the user still sees what they picked).
import type { SinceRange } from '@/types/admin-analytics';

const RANGES: { value: SinceRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

export default function TimeRangeSelector({
  value, onSelect, isChanging = false,
}: {
  value: SinceRange;
  onSelect: (next: SinceRange) => void;
  isChanging?: boolean;
}) {
  const select = (next: SinceRange) => {
    if (next === value) return;
    onSelect(next);
  };

  return (
    <div role="group" aria-label="Time range" style={{
      display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10,
      background: 'var(--paper-2)', border: '1px solid var(--border)',
    }}>
      {RANGES.map((range) => {
        const active = range.value === value;
        return (
          <button
            key={range.value}
            type="button"
            aria-pressed={active}
            disabled={isChanging}
            onClick={() => select(range.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              cursor: isChanging ? 'not-allowed' : 'pointer',
              opacity: isChanging ? 0.6 : 1,
              fontSize: '0.82rem', fontWeight: active ? 600 : 500,
              color: active ? 'var(--ink)' : 'var(--ink-muted)',
              background: active ? 'var(--surface)' : 'transparent',
              boxShadow: active ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.08))' : 'none',
              transition: 'all 140ms ease',
            }}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
