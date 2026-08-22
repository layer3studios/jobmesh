'use client';
// FILE: src/components/ui/Tabs.tsx
// Accessible tabs with underline or pill styling and arrow-key navigation.
import { useId, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { RADIUS, TYPE, MOTION } from '../../theme/tokens';

export interface TabItem { id: string; label: ReactNode; content: ReactNode }

export function Tabs({
  tabs, defaultTabId, onChange, variant = 'underline', compact,
}: {
  tabs: TabItem[];
  defaultTabId?: string;
  onChange?: (id: string) => void;
  variant?: 'underline' | 'pill';
  /** Tighter gap between the tab strip and the panel content. */
  compact?: boolean;
}) {
  const baseId = useId();
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id);

  const select = (id: string) => { setActive(id); onChange?.(id); };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + dir + tabs.length) % tabs.length];
    select(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  const tabStyle = (selected: boolean): CSSProperties => {
    const common: CSSProperties = {
      appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: TYPE.base, fontWeight: 500, padding: '8px 12px',
      color: selected ? 'var(--ink)' : 'var(--ink-muted)', transition: `all ${MOTION.normal} ${MOTION.ease}`,
    };
    if (variant === 'pill') {
      return { ...common, borderRadius: RADIUS.pill, background: selected ? 'var(--accent-soft)' : 'transparent', color: selected ? 'var(--accent)' : 'var(--ink-muted)' };
    }
    return { ...common, borderBottom: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`, borderRadius: 0 };
  };

  return (
    <div>
      <div role="tablist" style={{ display: 'flex', gap: variant === 'pill' ? 6 : 4, borderBottom: variant === 'underline' ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              id={`${baseId}-tab-${t.id}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              style={tabStyle(selected)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${baseId}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${t.id}`}
          hidden={t.id !== active}
          style={{ paddingTop: compact ? 8 : 16, color: 'var(--ink)' }}
        >
          {t.id === active && t.content}
        </div>
      ))}
    </div>
  );
}
