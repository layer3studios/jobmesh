'use client';
// FILE: src/components/seeker/JobDetailPanel/Actions.tsx
// Apply (solid) · Mark applied (ghost) · Save (ghost). Marking applied and
// saving pop their icon once — the change is felt, not just seen. The
// bookmark note editor and the saved-note strip live below on hairline
// surfaces.
import { useState, useEffect, useRef } from 'react';
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

/** Re-runs the pop keyframe each time `on` flips to true. */
function usePop(on: boolean) {
  const [pop, setPop] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!on) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 360);
    return () => clearTimeout(t);
  }, [on]);
  return pop ? 'jb-pop' : '';
}

export default function Actions({
  job, mobileMode, isApplied, isComeBack, note,
  onToggleApplied, onToggleComeBack, onRemoveComeBack,
}: Props) {
  const [comeBackInput, setComeBackInput] = useState(false);
  const [noteVal, setNoteVal] = useState('');
  const appliedPop = usePop(isApplied);
  const savedPop = usePop(isComeBack);

  useEffect(() => { setComeBackInput(false); setNoteVal(''); }, [job._id]);

  return (
    <>
      <div className="jb-actions">
        <Button
          as="a"
          href={job.DirectApplyURL || job.ApplicationURL}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="md"
          style={{ flex: mobileMode ? 1 : undefined, minWidth: 150 }}
        >
          Apply at {job.Company} <ExternalLink size={13} />
        </Button>
        <Button
          variant={isApplied ? 'success' : 'ghost'}
          size="md"
          aria-pressed={isApplied}
          onClick={() => onToggleApplied(job._id)}
        >
          <CheckCircle2 size={14} className={appliedPop} /> {isApplied ? 'Applied' : 'Mark applied'}
        </Button>
        <Button
          variant={isComeBack ? 'secondary' : 'ghost'}
          size="md"
          aria-pressed={isComeBack}
          onClick={() => { if (isComeBack && onRemoveComeBack) onRemoveComeBack(job._id); else setComeBackInput(v => !v); }}
          title={isComeBack ? 'Remove from saved' : 'Save for later'}
          aria-label={isComeBack ? 'Remove from saved' : 'Save for later'}
        >
          {isComeBack ? <BookmarkCheck size={14} className={savedPop} /> : <Bookmark size={14} />}
          {isComeBack ? 'Saved' : 'Save'}
        </Button>
      </div>

      {comeBackInput && (
        <div className="rise" style={{
          marginTop: 12, padding: '12px 14px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
        }}>
          <label style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 6, display: 'block' }}>
            Add a note (optional)
          </label>
          <textarea
            autoFocus
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { onToggleComeBack(job._id, noteVal); setComeBackInput(false); setNoteVal(''); } }}
            placeholder="Apply this weekend after polishing CV…"
            rows={2}
            style={{
              width: '100%', padding: '8px 10px',
              fontSize: 14, fontFamily: 'inherit',
              border: '1px solid var(--border-strong)',
              borderRadius: 8, resize: 'vertical', minHeight: 50,
              background: 'var(--paper)', color: 'var(--ink)',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button
              variant="primary" size="sm"
              onClick={() => { onToggleComeBack(job._id, noteVal); setComeBackInput(false); setNoteVal(''); }}
            >Save</Button>
            <Button variant="ghost" size="sm" onClick={() => { setComeBackInput(false); setNoteVal(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isComeBack && note && !comeBackInput && (
        <div className="rise" style={{
          marginTop: 12, padding: '10px 12px',
          border: '1px solid var(--border)', borderLeft: '3px solid var(--warning)',
          borderRadius: 8, fontSize: 14, color: 'var(--ink-2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ flex: 1 }}>{note}</span>
          {onRemoveComeBack && (
            <button
              className="jb-icon-btn press--sm press"
              onClick={() => onRemoveComeBack(job._id)}
              style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 2, borderRadius: 4 }}
              title="Remove"
              aria-label="Remove note"
            ><XIcon size={12} /></button>
          )}
        </div>
      )}
    </>
  );
}
