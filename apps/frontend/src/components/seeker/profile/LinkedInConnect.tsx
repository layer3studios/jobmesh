'use client';
// FILE: src/components/seeker/profile/LinkedInConnect.tsx
// LinkedIn on the proof-of-work section. There is no API to read, so the
// connection is the URL itself: paste it once, it becomes a link on the
// preview and the public page. Edit or remove it here.
import { useEffect, useState } from 'react';
import { Linkedin, Check, ExternalLink } from 'lucide-react';
import { Button, Alert } from '../../ui';
import type { ParsedProfile } from '../../../types/seeker-profile';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import { TextInput } from './editor';
import { ConnectShell } from './ConnectShell';

function normalise(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!/linkedin\.com$/i.test(u.hostname.replace(/^www\./, ''))) return null;
    return u.toString().replace(/\/$/, '');
  } catch { return null; }
}

function handleOf(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/linkedin\.com\/(?:in|pub)\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function LinkedInConnect({ profile, onSaved }: { profile: ParsedProfile; onSaved: (p: ParsedProfile) => void }) {
  const current = profile.linkedinUrl;
  const [editing, setEditing] = useState(!current);
  const [value, setValue] = useState(current ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setValue(current ?? ''); setEditing(!current); }, [current]);

  const save = async (url: string | null) => {
    setBusy(true); setError(null);
    try { onSaved(await patchProfile({ linkedinUrl: url })); setEditing(false); }
    catch (err) { setError(err instanceof SeekerApiError ? err.message : 'Could not save. Try again.'); }
    finally { setBusy(false); }
  };

  const submit = () => {
    const url = normalise(value);
    if (!url) { setError('That does not look like a LinkedIn profile URL. It should start with linkedin.com/in/.'); return; }
    void save(url);
  };

  return (
    <ConnectShell
      icon={<Linkedin size={17} />}
      name="LinkedIn"
      tone="linkedin"
      handle={handleOf(current)}
      href={current}
      connected={!!current && !editing}
      busy={busy}
      onRefresh={current ? () => setEditing(true) : undefined}
      onDisconnect={current ? () => void save(null) : undefined}
      disconnectLabel="Remove"
    >
      {current && !editing ? (
        <div className="pf-conn__row">
          <p className="pf-conn__text">Recruiters see a LinkedIn button on your public page. It opens this profile.</p>
          <a className="pf-conn__link press" href={current} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Open LinkedIn</a>
        </div>
      ) : (
        <div className="pf-conn__form">
          <p className="pf-conn__text">Paste your profile URL. It becomes the LinkedIn button on your preview and your public page.</p>
          {error && <Alert type="error">{error}</Alert>}
          <div className="pf-conn__inline">
            <TextInput
              value={value} placeholder="https://linkedin.com/in/you" inputMode="url" autoCapitalize="none" spellCheck={false} disabled={busy}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && value.trim()) submit(); }}
            />
            <Button disabled={busy || !value.trim()} onClick={submit} iconLeft={<Check size={13} />}>{busy ? 'Saving' : current ? 'Update' : 'Connect'}</Button>
            {current && <Button variant="ghost" onClick={() => { setEditing(false); setValue(current); setError(null); }}>Cancel</Button>}
          </div>
        </div>
      )}
    </ConnectShell>
  );
}
