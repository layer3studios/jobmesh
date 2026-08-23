'use client';
// FILE: assignments/parts/AssignmentMarkdownField.tsx
// A labelled markdown textarea with a live character count and a preview toggle.
// Split out of AssignmentFormModal.tsx (naming conventions section 2).
//
// Moved verbatim: it already took every value it needs as a prop, so nothing about
// its behaviour or its props changed.

import { useState } from 'react';
import { Textarea } from '@/components/ui';
import Markdown from '@/components/shared/Markdown';

const helperStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--ink-muted)', margin: '5px 0 0', lineHeight: 1.5 };

/** A textarea with a Write / Preview tab pair over the shared markdown renderer. */
export default function MarkdownField({
  label, value, error, rows, placeholder, onChange,
}: {
  label: string; value: string; error?: string; rows: number; placeholder?: string;
  onChange: (next: string) => void;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    borderRadius: 6, border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent'),
    background: active ? 'var(--paper-2)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-muted)',
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink-muted)' }}>{label}</span>
        <div role="tablist" aria-label={`${label} editor mode`} style={{ display: 'flex', gap: 4 }}>
          <button type="button" role="tab" aria-selected={tab === 'write'} style={tabStyle(tab === 'write')} onClick={() => setTab('write')}>Write</button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} style={tabStyle(tab === 'preview')} onClick={() => setTab('preview')}>Preview</button>
        </div>
      </div>
      {tab === 'write' ? (
        <Textarea aria-label={label} rows={rows} value={value} error={error} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', minHeight: 88 }}>
          {value.trim()
            ? <Markdown>{value}</Markdown>
            : <p style={{ ...helperStyle, margin: 0 }}>Nothing to preview yet.</p>}
        </div>
      )}
      {error && tab === 'preview' && <p role="alert" style={{ ...helperStyle, color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
