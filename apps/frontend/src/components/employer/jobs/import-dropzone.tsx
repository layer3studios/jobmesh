'use client';
// FILE: src/components/employer/jobs/import-dropzone.tsx
// Shared pieces of the bulk-import modal: a drag-and-drop file well, and the
// results summary. Split out so BulkImportModal stays about the flow rather than
// the chrome around it.

import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button, Stack } from '@/components/ui';
import type { ImportSummary } from '@/api/employer-import-export-api';

/** Human file size — a recruiter checking they grabbed the right archive. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({ accept, file, onFile, label, hint, disabled = false }: {
  accept: string;
  file: File | null;
  onFile: (file: File | null) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  if (file) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        border: '1px solid var(--border-strong)', borderRadius: 10, background: 'var(--surface-raised)',
      }}>
        <FileText size={16} aria-hidden="true" style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{formatSize(file.size)}</span>
        <button type="button" aria-label={`Remove ${file.name}`} disabled={disabled}
          onClick={() => onFile(null)}
          style={{ display: 'inline-flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-muted)' }}>
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped && !disabled) onFile(dropped);
      }}
      style={{
        border: `1px dashed ${isOver ? 'var(--accent)' : 'var(--border-strong)'}`,
        background: isOver ? 'var(--accent-soft)' : 'transparent',
        borderRadius: 12, padding: '26px 16px', textAlign: 'center',
        transition: 'background 0.12s ease, border-color 0.12s ease',
      }}
    >
      <UploadCloud size={22} aria-hidden="true" style={{ color: 'var(--ink-faint)' }} />
      <p style={{ margin: '8px 0 2px', fontSize: '0.88rem', color: 'var(--ink)' }}>{label}</p>
      <p style={{ margin: '0 0 10px', fontSize: '0.76rem', color: 'var(--ink-faint)' }}>{hint}</p>
      <Button variant="secondary" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Choose file
      </Button>
      <input
        ref={inputRef} type="file" accept={accept} hidden
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

/** The post-import summary: three counts, with the failures expandable beneath. */
export function ImportResults({ summary }: { summary: ImportSummary }) {
  const [showErrors, setShowErrors] = useState(false);
  const counts = [
    { label: 'imported', value: summary.imported, color: 'var(--success)' },
    { label: 'duplicates skipped', value: summary.duplicates, color: 'var(--ink-muted)' },
    { label: 'failed', value: summary.failed, color: summary.failed > 0 ? 'var(--danger)' : 'var(--ink-muted)' },
  ];
  // Only shown when it happened. A permanent "0 do not contact" column would give
  // a rare, alarming-sounding outcome equal billing with the everyday ones.
  if (summary.doNotContact) {
    counts.push({ label: 'skipped (do not contact)', value: summary.doNotContact, color: 'var(--danger)' });
  }

  return (
    <Stack gap={10}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {counts.map((count) => (
          <div key={count.label}>
            <div style={{ fontSize: 24, fontWeight: 600, color: count.color }}>{count.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{count.label}</div>
          </div>
        ))}
      </div>
      {summary.errors.length > 0 && (
        <div>
          <Button variant="link" size="sm" onClick={() => setShowErrors((prev) => !prev)}>
            {showErrors ? 'Hide details' : `Show ${summary.errors.length} problem${summary.errors.length === 1 ? '' : 's'}`}
          </Button>
          {showErrors && (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, maxHeight: 160, overflowY: 'auto' }}>
              {summary.errors.map((error, index) => (
                <li key={`${error.filename}-${index}`} style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 3 }}>
                  <strong style={{ color: 'var(--ink)' }}>{error.filename}</strong> — {error.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Stack>
  );
}
