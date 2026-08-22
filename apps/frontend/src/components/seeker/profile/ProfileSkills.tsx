'use client';
// FILE: src/components/seeker/profile/ProfileSkills.tsx
// Skills card. View shows skill chips; Edit lets the seeker add/remove chips and
// PATCHes the skills array (each chip stored as { name, category, proficiency }).

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, Button, Input, Badge, Alert, Stack } from '../../ui';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import type { ParsedProfile } from '../../../types/seeker-profile';

export default function ProfileSkills({ profile, onSaved }: {
  profile: ParsedProfile;
  onSaved: (p: ParsedProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>(profile.skills.map((s) => s.name));
  const [draft, setDraft] = useState('');

  const addSkill = () => {
    const value = draft.trim();
    if (value && !names.includes(value)) setNames((n) => [...n, value]);
    setDraft('');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await patchProfile({ skills: names.map((name) => ({ name, category: null, proficiency: null })) });
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Stack gap={12}>
        <Stack gap={8} dir="row" align="center" justify="space-between">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Skills</h3>
          {!editing && <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
        </Stack>
        {error && <Alert type="error">{error}</Alert>}

        {editing ? (
          <Stack gap={10}>
            <Stack gap={6} dir="row" wrap>
              {names.map((name) => (
                <Badge key={name} variant="neutral">
                  {name}
                  <Button
                    variant="link" aria-label={`Remove ${name}`} style={{ color: 'inherit', marginLeft: 2 }}
                    onClick={() => setNames((n) => n.filter((x) => x !== name))}
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              ))}
            </Stack>
            <Stack gap={8} dir="row" wrap align="flex-end">
              <div style={{ flex: '1 1 200px' }}>
                <Input
                  label="Add a skill" value={draft} placeholder="e.g. Node.js"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                />
              </div>
              <Button variant="secondary" onClick={addSkill}>Add</Button>
            </Stack>
            <Stack gap={8} dir="row">
              <Button loading={saving} onClick={save}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={6} dir="row" wrap>
            {profile.skills.length === 0
              ? <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>No skills yet.</p>
              : profile.skills.map((s) => <Badge key={s.name} variant="neutral">{s.name}</Badge>)}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
