'use client';
// FILE: src/components/seeker/profile/ProfileContact.tsx
// Contact + Summary card on the profile page. View mode shows the fields; Edit
// reveals inputs and PATCHes the whitelisted keys (fullName, email, phone,
// currentLocation, linkedinUrl, summary) on save.

import { useState } from 'react';
import { Card, Button, Input, Textarea, Alert, Stack } from '../../ui';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import type { ParsedProfile } from '../../../types/seeker-profile';

export default function ProfileContact({ profile, onSaved }: {
  profile: ParsedProfile;
  onSaved: (p: ParsedProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: profile.fullName ?? '', email: profile.email ?? '', phone: profile.phone ?? '',
    city: profile.currentLocation?.city ?? '', state: profile.currentLocation?.state ?? '',
    linkedinUrl: profile.linkedinUrl ?? '', summary: profile.summary ?? '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await patchProfile({
        fullName: form.fullName || null, email: form.email || null, phone: form.phone || null,
        currentLocation: { city: form.city || null, state: form.state || null },
        linkedinUrl: form.linkedinUrl || null, summary: form.summary || null,
      });
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const location = [profile.currentLocation?.city, profile.currentLocation?.state].filter(Boolean).join(', ');

  return (
    // data-ph-mask: seeker's own name/email/phone/summary — masked in replay.
    <div data-ph-mask style={{ display: 'contents' }}>
    <Card>
      <Stack gap={12}>
        <Stack gap={8} dir="row" align="center" justify="space-between">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Contact</h3>
          {!editing && <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
        </Stack>
        {error && <Alert type="error">{error}</Alert>}

        {editing ? (
          <Stack gap={10}>
            <Input label="Full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Stack gap={10} dir="row" wrap>
              <div style={{ flex: '1 1 160px' }}><Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div style={{ flex: '1 1 160px' }}><Input label="State" value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
            </Stack>
            <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
            <Textarea label="Summary" rows={4} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
            <Stack gap={8} dir="row">
              <Button loading={saving} onClick={save}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={4}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>{profile.fullName || 'Unnamed'}</p>
            {profile.email && <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{profile.email}</p>}
            {profile.phone && <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{profile.phone}</p>}
            {location && <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{location}</p>}
            {profile.linkedinUrl && <p style={{ fontSize: '0.875rem', color: 'var(--link)' }}>{profile.linkedinUrl}</p>}
            {profile.summary && <p style={{ fontSize: '0.875rem', color: 'var(--ink)', marginTop: 6, lineHeight: 1.55 }}>{profile.summary}</p>}
          </Stack>
        )}
      </Stack>
    </Card>
    </div>
  );
}
