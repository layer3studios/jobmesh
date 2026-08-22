'use client';
// FILE: src/components/seeker/ResumeUploadZone.tsx
// Custom drag-and-drop resume uploader (no third-party lib, C7/R1). Two tabs:
// a PDF drop zone (native HTML5 drag events + hidden file input) and a paste-text
// fallback (R4). Client-side validates PDF mimetype + 5MB before hitting the API.
// Parsing state lives on the page now (F2) — this zone only owns the pre-submit
// validation Alert and a brief in-flight disable while the enqueue POST runs.

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Tabs, Button, Textarea, Alert, Stack } from '../ui';
import type { TabItem } from '../ui';
import { uploadResume, uploadResumeText, SeekerApiError } from '../../api/seeker-api';
import type { ResumeUploadResult } from '../../types/seeker-profile';

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  onUploadComplete: (result: ResumeUploadResult) => void;
}

export default function ResumeUploadZone({ onUploadComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<ResumeUploadResult>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      onUploadComplete(await fn());
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please choose a PDF file.'); return; }
    if (file.size > MAX_BYTES) { setError('Resume must be 5MB or smaller.'); return; }
    void run(() => uploadResume(file));
  };

  const dropZone = (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => { if (!isSubmitting) inputRef.current?.click(); }}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isSubmitting) inputRef.current?.click(); }}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '40px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: dragging ? 'var(--accent-soft)' : 'var(--surface)', transition: 'all 150ms ease',
        }}
      >
        <UploadCloud size={30} color="var(--ink-muted)" aria-hidden />
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--ink)' }}>
          Drag and drop your resume PDF here, or click to browse
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>PDF only, max 5 MB</p>
      </div>
      <input
        ref={inputRef} type="file" accept="application/pdf,.pdf" hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );

  const pasteZone = (
    <Stack gap={10}>
      <Textarea
        label="Resume text" rows={10} value={text} placeholder="Paste your resume text here…"
        onChange={(e) => setText(e.target.value)}
      />
      <div>
        <Button disabled={isSubmitting || text.trim().length < 200} onClick={() => void run(() => uploadResumeText(text.trim()))}>
          Parse resume
        </Button>
      </div>
    </Stack>
  );

  const tabs: TabItem[] = [
    { id: 'upload', label: 'Upload PDF', content: dropZone },
    { id: 'paste', label: 'Paste text', content: pasteZone },
  ];

  return (
    <Stack gap={12}>
      {error && (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>Try again</Button>
          </Stack>
        </Alert>
      )}
      <Tabs tabs={tabs} defaultTabId="upload" />
    </Stack>
  );
}
