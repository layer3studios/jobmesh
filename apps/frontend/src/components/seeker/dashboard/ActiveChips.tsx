'use client';
// FILE: src/components/seeker/dashboard/ActiveChips.tsx
// The applied-filters row under the filter bar: what is actually narrowing the
// list, each one removable where it stands, plus "Clear all".
//
// Each chip names its filter type above the value ("Posted" / "Last 3 days").
// Baymard's applied-filter testing: show the selected options rather than a
// count, carry the type when a value alone is ambiguous — "0-2" or "3d" tells
// nobody what it filtered — keep the type secondary to the value, and be
// consistent instead of prefixing some chips and not others.
// https://baymard.com/blog/how-to-design-applied-filters
import { X } from 'lucide-react';
import type { FilterChip } from './filter-schema';

interface Props {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
  onClearAll: () => void;
}

export default function ActiveChips({ chips, onRemove, onClearAll }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="jb-active" aria-label={`${chips.length} ${chips.length === 1 ? 'filter' : 'filters'} applied`}>
      {chips.map((chip, i) => (
        <span key={chip.key} className="jb-active__chip" style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}>
          <span className="jb-active__text">
            <span className="jb-active__group">{chip.group}</span>
            <span className="jb-active__value">{chip.label}</span>
          </span>
          <button
            type="button"
            className="jb-active__x"
            onClick={() => onRemove(chip)}
            aria-label={`Remove ${chip.group} filter ${chip.label}`}
          >
            <X size={10} aria-hidden />
          </button>
        </span>
      ))}
      <button type="button" className="jb-active__clear press" onClick={onClearAll}>Clear all</button>
    </div>
  );
}
