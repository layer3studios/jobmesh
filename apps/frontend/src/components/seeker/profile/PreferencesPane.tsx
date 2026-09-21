'use client';
// FILE: src/components/seeker/profile/PreferencesPane.tsx
// What you want next: notice period as pills (nobody types "30 days"),
// current and expected pay in LPA, and the one Save button.
import { useEffect, useState } from 'react';
import type { ParsedProfile } from '../../../types/seeker-profile';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import { Field, TextInput, Pills, PaneHead, PaneError, useDirty } from './editor';

const NOTICE = ['Immediate', '15 days', '30 days', '60 days', '90 days', 'Serving notice'];

interface Props { profile: ParsedProfile; onSaved: (p: ParsedProfile) => void }

const num = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v));

function fromProfile(p: ParsedProfile) {
  return {
    noticePeriod: p.noticePeriod ?? '',
    currentCTC: p.currentCTC?.amount != null ? String(p.currentCTC.amount) : '',
    expectedCTC: p.expectedCTC?.amount != null ? String(p.expectedCTC.amount) : '',
  };
}

export default function PreferencesPane({ profile, onSaved }: Props) {
  const saved = fromProfile(profile);
  const [form, setForm] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setForm(fromProfile(profile)); }, [profile]);
  const dirty = useDirty(saved, form);
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }));

  const cur = num(form.currentCTC), exp = num(form.expectedCTC);
  const hike = cur && exp && cur > 0 ? Math.round(((exp - cur) / cur) * 100) : null;

  const save = async () => {
    setSaving(true); setError(null);
    try {
      onSaved(await patchProfile({
        noticePeriod: form.noticePeriod || null,
        currentCTC: { amount: cur, currency: 'INR' },
        expectedCTC: { amount: exp, currency: 'INR' },
      }));
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not save. Try again.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <PaneHead title="Preferences" sub="What you want next. Recruiters filter on this first." dirty={dirty} saving={saving} savedAt={savedAt} onSave={() => void save()} />
      <div className="pfx-sec__body">
        {error && <PaneError message={error} onDismiss={() => setError(null)} />}
        <Field label="Notice period" hint="Recruiters filter on this first. 'Immediate' gets the most replies.">
          <Pills options={NOTICE} value={form.noticePeriod ? [form.noticePeriod] : []} onToggle={v => set('noticePeriod', form.noticePeriod === v ? '' : v)} />
        </Field>
        <div className="pf-row">
          <Field label="Current pay (₹ LPA)" hint="Private. Used only to benchmark you against the market."><TextInput type="number" inputMode="decimal" min={0} value={form.currentCTC} onChange={e => set('currentCTC', e.target.value)} placeholder="12" /></Field>
          <Field label="Expected pay (₹ LPA)" hint={hike != null ? `${hike > 0 ? '+' : ''}${hike}% from current` : 'What you would say yes to.'}><TextInput type="number" inputMode="decimal" min={0} value={form.expectedCTC} onChange={e => set('expectedCTC', e.target.value)} placeholder="18" /></Field>
        </div>
      </div>
    </>
  );
}
