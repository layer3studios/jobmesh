'use client';
// FILE: src/components/seeker/JobDetailPanel/Actions.tsx
import { useState, useEffect } from 'react';
import { CheckCircle2, ExternalLink, X as XIcon, Bookmark, BookmarkCheck } from 'lucide-react';
import type { IJob } from '../../../types';
import { Button } from '../../ui';

interface Props {
  job: IJob;
  mobileMode?: boolean;
  isApplied: boolean;
  isComeBack: boolean;
  note: string;
  onToggleApplied: (id: string) => void;
  onToggleComeBack: (id: string, note?: string) => void;
  onRemoveComeBack?: (id: string) => void;
}

export default function Actions({
  job, mobileMode, isApplied, isComeBack, note,
  onToggleApplied, onToggleComeBack, onRemoveComeBack,
}: Props) {
  const [comeBackInput, setComeBackInput] = useState(false);
  const [noteVal, setNoteVal] = useState('');

  useEffect(() => { setComeBackInput(false); setNoteVal(''); }, [job._id]);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <Button
          as="a"
          href={job.DirectApplyURL || job.ApplicationURL}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="md"
          style={{ flex: mobileMode ? 1 : undefined, minWidth: 130 }}
        >
          <ExternalLink size={14} /> Apply now
        </Button>
        <Button
          variant={isApplied ? 'success' : 'ghost'}
          size="md"
          onClick={() => onToggleApplied(job._id)}
        >
          <CheckCircle2 size={14} /> {isApplied ? 'Applied' : 'Mark applied'}
        </Button>
        <Button
          variant={isComeBack ? 'secondary' : 'ghost'}
          size="md"
          onClick={() => { if (isComeBack && onRemoveComeBack) onRemoveComeBack(job._id); else setComeBackInput(true); }}
          title={isComeBack ? 'Remove bookmark' : 'Save for later'}
        >
          {isComeBack ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {isComeBack ? 'Saved' : 'Save'}
        </Button>
      </div>

      {comeBackInput && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'var(--paper-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 6, display: 'block' }}>
            Add a note (optional)
          </label>
          <textarea
            autoFocus
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            placeholder="Apply this weekend after polishing CV…"
            rows={2}
            style={{
              width: '100%', padding: '8px 10px',
              fontSize: '0.85rem', fontFamily: 'inherit',
              border: '1px solid var(--border-strong)',
              borderRadius: 8, resize: 'vertical', minHeight: 50,
              background: 'var(--surface)', color: 'var(--ink)',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button
              variant="primary" size="sm"
              onClick={() => { onToggleComeBack(job._id, noteVal); setComeBackInput(false); setNoteVal(''); }}
            >Save bookmark</Button>
            <Button variant="ghost" size="sm" onClick={() => { setComeBackInput(false); setNoteVal(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isComeBack && note && !comeBackInput && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: 'var(--warning-soft)', color: 'var(--warning)',
          borderRadius: 8, fontSize: '0.85rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ flex: 1 }}>📝 {note}</span>
          {onRemoveComeBack && (
            <button
              onClick={() => onRemoveComeBack(job._id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}
              title="Remove"
            ><XIcon size={12} /></button>
          )}
        </div>
      )}
    </>
  );
}
