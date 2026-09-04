'use client';
// FILE: src/components/seeker/DashboardSearchBar.tsx
// The board's search band: one wide hairline input and, when the seeker has
// skills, a mono "Sort by match" toggle. Focus/hover states live in board.css.
import { Search, X } from 'lucide-react';
import { MONO } from './JobDetailPanel/job-detail-helpers';

interface Props {
  search: string;
  onSearchChange: (s: string) => void;
  sortByMatch: boolean;
  onToggleSortByMatch: () => void;
  hasSkills: boolean;
}

export default function DashboardSearchBar({ search, onSearchChange, sortByMatch, onToggleSortByMatch, hasSkills }: Props) {
  return (
    <div style={{ display: 'flex', gap: 'var(--gutter)', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
        <input
          className="jb-search"
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by role, company, or skill"
          aria-label="Search jobs"
          style={{
            width: '100%', height: 44, padding: '0 36px 0 40px',
            fontFamily: 'inherit', fontSize: 14,
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: 12, outline: 'none',
          }}
        />
        {search && (
          <button
            className="jb-icon-btn"
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 26, height: 26, borderRadius: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {hasSkills && (
        <button
          className="jb-sort"
          onClick={onToggleSortByMatch}
          aria-pressed={sortByMatch}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 44, padding: '0 16px', borderRadius: 12,
            border: '1px solid',
            borderColor: sortByMatch ? 'var(--ink)' : 'var(--border)',
            background: sortByMatch ? 'var(--ink)' : 'transparent',
            color: sortByMatch ? 'var(--paper)' : 'var(--ink-muted)',
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Sort by match <span aria-hidden>✦</span>
        </button>
      )}
    </div>
  );
}
