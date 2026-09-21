'use client';
// FILE: src/components/seeker/dashboard/ActiveChips.tsx
// The row of applied filters under the filter bar. Each chip rises in and its
// × presses; "Clear all" resets everything (board.css .jb-active).
import { X } from 'lucide-react';

interface Chip { label: string; clear: () => void; }

interface Props {
  filters: Chip[];
  onClearAll: () => void;
}

export default function ActiveChips({ filters, onClearAll }: Props) {
  if (filters.length === 0) return null;
  return (
    <div className="jb-active" aria-label="Active filters">
      {filters.map((f, i) => (
        <span key={`${f.label}-${i}`} className="jb-active__chip" style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}>
          {f.label}
          <button type="button" className="jb-active__x" onClick={f.clear} aria-label={`Remove ${f.label}`}>
            <X size={10} />
          </button>
        </span>
      ))}
      <button type="button" className="jb-active__clear press" onClick={onClearAll}>Clear all</button>
    </div>
  );
}
