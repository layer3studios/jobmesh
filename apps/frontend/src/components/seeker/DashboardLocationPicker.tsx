'use client';
// FILE: src/components/seeker/DashboardLocationPicker.tsx
// The city picker: a searchable dropdown over the facet city list. Split out of
// DashboardFilterBar.tsx (section 2) -- it carries its own search state, which the
// plain multi-select does not.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Z } from '@/theme/tokens';
import { MAX_LOCATIONS } from './dashboard/constants';

/** Searchable city picker fed by the facets endpoint; up to MAX_LOCATIONS cities. */
export function LocationPicker({ cities, selected, onChange, baseStyle }: {
  cities: { city: string; count: number }[];
  selected: string[];
  onChange: (v: string[]) => void;
  baseStyle: CSSProperties;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const suggestions = cities
    .filter(c => !selected.some(s => s.toLowerCase() === c.city.toLowerCase()))
    .filter(c => !q || c.city.toLowerCase().includes(q))
    .slice(0, 8);
  const atLimit = selected.length >= MAX_LOCATIONS;

  const add = (city: string) => {
    if (atLimit) return;
    onChange([...selected, city]);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        placeholder={atLimit ? `Max ${MAX_LOCATIONS} cities` : (selected.length ? `Location · ${selected.length}` : 'Location')}
        disabled={atLimit}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && suggestions.length > 0) { e.preventDefault(); add(suggestions[0].city); }
          if (e.key === 'Escape') setOpen(false);
        }}
        style={{ ...baseStyle, width: 132, backgroundImage: 'none', cursor: atLimit ? 'not-allowed' : 'text' }}
      />
      {open && suggestions.length > 0 && !atLimit && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: Z.dropdown,
          minWidth: 180, maxHeight: 260, overflowY: 'auto',
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          borderRadius: 10, boxShadow: 'var(--shadow-md)', padding: 4,
        }}>
          {suggestions.map(c => (
            <button
              key={c.city}
              onClick={() => add(c.city)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                width: '100%', padding: '7px 10px', borderRadius: 7,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.82rem', color: 'var(--ink)', textAlign: 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span>{c.city}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{c.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
