'use client';
// FILE: src/components/seeker/PipelineView/Controls.tsx
import { Search, X as XIcon } from 'lucide-react';
import { STAGES, STAGE_ORDER } from '../PipelineCard';

interface Props {
  search: string;
  stageFilter: string | null;
  setSearch: (v: string) => void;
  setStageFilter: (v: string | null) => void;
}

export default function Controls({ search, stageFilter, setSearch, setStageFilter }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 220px' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search company or role…"
          style={{
            width: '100%', padding: '9px 12px 9px 34px',
            fontFamily: 'inherit', fontSize: '0.85rem',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10, outline: 'none',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--ink-faint)', padding: 4,
          }}><XIcon size={12} /></button>
        )}
      </div>
      <select
        value={stageFilter || ''}
        onChange={e => setStageFilter(e.target.value || null)}
        style={{
          padding: '9px 12px', fontFamily: 'inherit', fontSize: '0.85rem',
          background: 'var(--surface)', color: 'var(--ink)',
          border: '1px solid var(--border-strong)',
          borderRadius: 10, outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="">All stages</option>
        {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGES[s].label}</option>)}
      </select>
    </div>
  );
}
