'use client';
// FILE: src/components/ui/FileUpload.tsx
// Drag-and-drop + click-to-browse file picker with type/size validation.
import { useId, useRef, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { RADIUS, TYPE } from '../../theme/tokens';
import { Button } from './Button';
import { Badge } from './Badge';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept, maxSizeMegabytes, onUpload,
}: {
  accept: string;
  maxSizeMegabytes: number;
  onUpload: (file: File) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const allowed = accept.split(',').map((s) => s.trim().toLowerCase());

  const handle = (f: File | undefined) => {
    if (!f) return;
    const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
    if (allowed.length && !allowed.includes(ext)) { setError(`File type must be ${accept}`); setFile(null); return; }
    if (f.size > maxSizeMegabytes * 1024 * 1024) { setError(`File must be under ${maxSizeMegabytes} MB`); setFile(null); return; }
    setError(null); setFile(f); onUpload(f);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          padding: 24, borderRadius: RADIUS.lg, cursor: 'pointer',
          border: `1.5px dashed ${error ? 'var(--danger)' : dragging ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: dragging ? 'var(--accent-soft)' : 'var(--surface)', transition: 'all 150ms ease',
        }}
      >
        <UploadCloud size={28} color="var(--ink-faint)" />
        <p style={{ fontSize: TYPE.base, color: 'var(--ink)', fontWeight: 500, margin: 0 }}>
          Drag &amp; drop, or
        </p>
        <Button variant="secondary" size="sm" type="button">Browse files</Button>
        <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', margin: 0 }}>{accept} · max {maxSizeMegabytes} MB</p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={(e) => handle(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 8, fontWeight: 500 }}>{error}</p>}
      {file && !error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: 'var(--ink)', fontSize: TYPE.sm }}>
          <FileText size={16} color="var(--accent)" />
          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          <Badge variant="neutral" size="sm">{formatSize(file.size)}</Badge>
        </div>
      )}
    </div>
  );
}
