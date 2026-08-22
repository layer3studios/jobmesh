'use client';
// FILE: src/components/seeker/profile/ProfilePreferences.tsx
// Preferences card: notice period, current/expected CTC (LPA), domain, subDomain.
// Edit reveals inputs and PATCHes the whitelisted keys on save.

import { useState } from 'react';
import { Card, Button, Input, Alert, Stack } from '../../ui';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import type { ParsedProfile } from '../../../types/seeker-profile';

const num = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v));

export default function ProfilePreferences({ profile, onSaved }: {
  profile: ParsedProfile;
  onSaved: (p: ParsedProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    noticePeriod: profile.noticePeriod ?? '',
    currentCTC: profile.currentCTC?.amount != null ? String(profile.currentCTC.amount) : '',
    expectedCTC: profile.expectedCTC?.amount != null ? String(profile.expectedCTC.amount) : '',
    domain: profile.domain ?? '', subDomain: profile.subDomain ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await patchProfile({
        noticePeriod: form.noticePeriod || null,
        currentCTC: { amount: num(form.currentCTC), currency: 'INR' },
        expectedCTC: { amount: num(form.expectedCTC), currency: 'INR' },
        domain: form.domain || null, subDomain: form.subDomain || null,
      });
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const row = (label: string, value: string | null) => value && (
    <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{label}: </span>{value}
    </p>
  );
  const ctcText = (c: ParsedProfile['currentCTC']) => (c?.amount != null ? `${c.amount} LPA` : null);

  return (
    <Card>
      <Stack gap={12}>
        <Stack gap={8} dir="row" align="center" justify="space-between">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Preferences</h3>
          {!editing && <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
        </Stack>
        {error && <Alert type="error">{error}</Alert>}

        {editing ? (
          <Stack gap={10}>
            <Input label="Notice period" value={form.noticePeriod} onChange={(e) => set('noticePeriod', e.target.value)} />
            <Stack gap={10} dir="row" wrap>
              <div style={{ flex: '1 1 150px' }}><Input label="Current CTC (LPA)" type="number" value={form.currentCTC} onChange={(e) => set('currentCTC', e.target.value)} /></div>
              <div style={{ flex: '1 1 150px' }}><Input label="Expected CTC (LPA)" type="number" value={form.expectedCTC} onChange={(e) => set('expectedCTC', e.target.value)} /></div>
            </Stack>
            <Input label="Domain" value={form.domain} onChange={(e) => set('domain', e.target.value)} />
            <Input label="Sub-domain" value={form.subDomain} onChange={(e) => set('subDomain', e.target.value)} />
            <Stack gap={8} dir="row">
              <Button loading={saving} onClick={save}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={4}>
            {row('Notice period', profile.noticePeriod)}
            {row('Current CTC', ctcText(profile.currentCTC))}
            {row('Expected CTC', ctcText(profile.expectedCTC))}
            {row('Domain', profile.domain)}
            {row('Sub-domain', profile.subDomain)}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
