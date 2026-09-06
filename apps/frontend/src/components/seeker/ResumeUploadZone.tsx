'use client';
// FILE: src/components/seeker/ResumeUploadZone.tsx
// The resume drop zone — the hero of /resume. Native HTML5 drag events + a
// hidden file input, no third-party lib (C7/R1). Client-side validates PDF
// mimetype + 5MB before hitting the API. A quiet link swaps in the paste-text
// fallback (R4) for scanned or image PDFs. Parsing state lives on the page
// (F2) — this zone only owns pre-submit validation and a brief in-flight
// disable while the enqueue POST runs.

import { useRef, useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { Button, Textarea, Alert, Stack } from '../ui';
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
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [text, setText] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fail = (msg: string) => { setError(msg); setErrorKey(k => k + 1); };

  const run = async (fn: () => Promise<ResumeUploadResult>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      onUploadComplete(await fn());
    } catch (err) {
      fail(err instanceof SeekerApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { fail('That isn’t a PDF. Export your resume as PDF and drop it here.'); return; }
    if (file.size > MAX_BYTES) { fail('That file is over 5 MB. Most resumes are under 1 MB — try exporting without images.'); return; }
    void run(() => uploadResume(file));
  };

  return (
    <Stack gap={14}>
      {error && (
        <div key={errorKey} className="shake" role="alert">
          <Alert type="error">
            <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </Stack>
          </Alert>
        </div>
      )}

      {mode === 'file' ? (
        <>
          <div
            className="rs-drop"
            data-dragging={dragging || undefined}
            role="button"
            tabIndex={0}
            aria-busy={isSubmitting || undefined}
            onClick={() => { if (!isSubmitting) inputRef.current?.click(); }}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isSubmitting) { e.preventDefault(); inputRef.current?.click(); } }}
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
          >
            <span className="rs-drop__icon"><UploadCloud size={24} aria-hidden /></span>
            <p className="rs-drop__title">{isSubmitting ? 'Sending it over…' : dragging ? 'Drop it.' : 'Drop your resume here'}</p>
            <p className="rs-drop__sub">or click to choose a file. We read it once and build your profile from it.</p>
            <p className="rs-drop__meta">PDF · up to 5 MB · deleted after parsing</p>
          </div>
          <input
            ref={inputRef} type="file" accept="application/pdf,.pdf" hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center' }}>
            Scanned or image-only PDF?{' '}
            <button type="button" className="press" onClick={() => setMode('text')} style={{ background: 'none', border: 0, padding: 0, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', font: 'inherit' }}>
              Paste the text instead
            </button>
          </p>
        </>
      ) : (
        <div className="glass ws-section rise">
          <Stack gap={10}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} style={{ color: 'var(--ink-muted)' }} />
              <span className="ws-section__label">Paste your resume text</span>
            </div>
            <Textarea
              label="Resume text" rows={10} value={text} placeholder="Paste everything — name, experience, skills, education…"
              onChange={(e) => setText(e.target.value)}
            />
            <Stack gap={8} dir="row" align="center" wrap>
              <Button disabled={isSubmitting || text.trim().length < 200} loading={isSubmitting} onClick={() => void run(() => uploadResumeText(text.trim()))}>
                Build my profile
              </Button>
              <span style={{ fontSize: 12.5, color: text.trim().length < 200 ? 'var(--ink-faint)' : 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {text.trim().length < 200 ? `${200 - text.trim().length} more characters` : `${text.trim().length.toLocaleString()} characters`}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setMode('file')}>Upload a PDF instead</Button>
            </Stack>
          </Stack>
        </div>
      )}
    </Stack>
  );
}
