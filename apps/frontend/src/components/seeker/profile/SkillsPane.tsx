'use client';
// FILE: src/components/seeker/profile/SkillsPane.tsx
// Skills as pills you type into existence. Enter or comma adds; × or
// Backspace on an empty box removes the last; suggestions come from the
// market (the most-asked-for tags across the board) so the seeker adds what
// recruiters actually search for.
import { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { ParsedProfile } from '../../../types/seeker-profile';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import { useJobFacets } from '../dashboard/useJobFacets';
import { Field, TextInput, PaneHead, PaneError, useDirty } from './editor';

interface Props { profile: ParsedProfile; onSaved: (p: ParsedProfile) => void; onDraft: (skills: string[]) => void }

export default function SkillsPane({ profile, onSaved, onDraft }: Props) {
  const saved = useMemo(() => profile.skills.map(s => s.name), [profile.skills]);
  const [names, setNames] = useState<string[]>(saved);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const facets = useJobFacets();
  useEffect(() => { setNames(saved); }, [saved]);
  useEffect(() => { onDraft(names); }, [names, onDraft]);

  const dirty = useDirty(saved, names);
  const lower = new Set(names.map(n => n.toLowerCase()));
  const add = (raw: string) => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setNames(n => [...n, ...parts.filter(p => !lower.has(p.toLowerCase()))]);
    setDraft('');
  };
  const suggestions = facets.techStack.filter(t => !lower.has(t.tag.toLowerCase())).slice(0, 12);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      onSaved(await patchProfile({ skills: names.map(name => ({ name, category: null, proficiency: null })) }));
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not save. Try again.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <PaneHead title="Skills" sub="Every role on the board is scored against this list." dirty={dirty} saving={saving} savedAt={savedAt} onSave={() => void save()} />
      <div className="pfx-sec__body">
        {error && <PaneError message={error} onDismiss={() => setError(null)} />}
        <Field label="Your skills" hint="Type and press Enter. Every role on the board is scored against this list — five or more makes the match meaningful.">
          <div className="pf-tags">
            {names.map((n, i) => (
              <span key={n} className="pf-tag rise" style={{ '--i': Math.min(i, 10) } as React.CSSProperties}>
                {n}
                <button type="button" className="pf-tag__x" aria-label={`Remove ${n}`} onClick={() => setNames(x => x.filter(v => v !== n))}><X size={10} /></button>
              </span>
            ))}
            <TextInput
              value={draft} placeholder={names.length ? 'Add another…' : 'React, Node.js, PostgreSQL…'}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); }
                if (e.key === 'Backspace' && !draft && names.length) setNames(n => n.slice(0, -1));
              }}
              onBlur={() => add(draft)}
              className="pf-tags__input"
            />
          </div>
        </Field>
        {suggestions.length > 0 && (
          <Field label="Most asked for right now" hint="Straight from the board. Tap to add.">
            <div className="pf-pills">
              {suggestions.map((s, i) => (
                <button key={s.tag} type="button" className="pf-pill" onClick={() => add(s.tag)} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
                  <Plus size={11} />{s.tag}<span className="pf-pill__n">{s.count}</span>
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>
    </>
  );
}
