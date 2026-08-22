'use client';
// FILE: src/components/seeker/DashboardSearchBar.tsx
import { Search, X, Sparkles } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (s: string) => void;
  sortByMatch: boolean;
  onToggleSortByMatch: () => void;
  hasSkills: boolean;
}

export default function DashboardSearchBar({ search, onSearchChange, sortByMatch, onToggleSortByMatch, hasSkills }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search role, company, skill…"
          style={{
            width: '100%', padding: '9px 32px 9px 34px',
            fontFamily: 'inherit', fontSize: '0.875rem',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10, outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
              color: 'var(--ink-faint)',
            }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {hasSkills && (
        <button
          onClick={onToggleSortByMatch}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid',
            borderColor: sortByMatch ? 'var(--accent)' : 'var(--border-strong)',
            background: sortByMatch ? 'var(--accent-soft)' : 'transparent',
            color: sortByMatch ? 'var(--accent)' : 'var(--ink-muted)',
            fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={12} /> Best match
        </button>
      )}
    </div>
  );
}
