'use client';
// FILE: src/components/seeker/profile/BasicInfoPane.tsx
// Who you are: your photo, who can see the page, your name, headline, where
// you are, the
// two-line About, the domains you work in, and how to reach you. LinkedIn
// lives in Proof of work, so nothing here is asked twice. One Save; the
// preview follows the keyboard.
import { useEffect, useState } from 'react';
import { Zap, Palette, Boxes, LineChart, Megaphone, Cloud, Shield, Smartphone, Database, Bug } from 'lucide-react';
import type { ParsedProfile } from '../../../types/seeker-profile';
import type { PublicProfileSettingsState, ProfileVisibility } from '../../../types/public-profile';
import { patchProfile, SeekerApiError } from '../../../api/seeker-api';
import { patchProfileSettings, PublicProfileApiError } from '../../../api/public-profile-api';
import AvatarField from './AvatarField';
import { Field, TextInput, TextArea, Pills, PaneHead, PaneError, useDirty } from './editor';
import VisibilityMenu from './VisibilityMenu';

const DOMAINS = ['Engineering', 'Frontend', 'Backend', 'Full Stack', 'Mobile', 'Data', 'ML/AI', 'DevOps/SRE', 'Security', 'Design', 'Product', 'QA'];
const ICONS: Record<string, React.ReactNode> = {
  Engineering: <Zap size={12} />, Frontend: <Palette size={12} />, Backend: <Boxes size={12} />, 'Full Stack': <Boxes size={12} />,
  Mobile: <Smartphone size={12} />, Data: <Database size={12} />, 'ML/AI': <LineChart size={12} />, 'DevOps/SRE': <Cloud size={12} />,
  Security: <Shield size={12} />, Design: <Palette size={12} />, Product: <Megaphone size={12} />, QA: <Bug size={12} />,
};
const ABOUT_MAX = 400;
const HEADLINE_MAX = 120;

interface Props {
  profile: ParsedProfile;
  settings: PublicProfileSettingsState | null;
  onSaved: (p: ParsedProfile) => void;
  onSettings: (s: PublicProfileSettingsState) => void;
  /** Live edits, so the preview follows the keyboard. */
  onDraft: (d: { fullName: string; summary: string; city: string; state: string; headline: string; domains: string[] }) => void;
}

function fromProfile(p: ParsedProfile, s: PublicProfileSettingsState | null) {
  return {
    fullName: p.fullName ?? '', email: p.email ?? '', phone: p.phone ?? '',
    city: p.currentLocation?.city ?? '', state: p.currentLocation?.state ?? '',
    summary: p.summary ?? '',
    headline: s?.settings.headline ?? '',
    domains: [p.domain, p.subDomain].filter((d): d is string => !!d),
    visibility: (s?.profileVisibility ?? (s?.profilePublic ? 'public' : 'private')) as ProfileVisibility,
  };
}

export default function BasicInfoPane({ profile, settings, onSaved, onSettings, onDraft }: Props) {
  const saved = fromProfile(profile, settings);
  const [form, setForm] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setForm(fromProfile(profile, settings)); }, [profile, settings]);
  useEffect(() => { onDraft({ fullName: form.fullName, summary: form.summary, city: form.city, state: form.state, headline: form.headline, domains: form.domains }); }, [form, onDraft]);

  const dirty = useDirty(saved, form);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const next = await patchProfile({
        fullName: form.fullName || null, email: form.email || null, phone: form.phone || null,
        currentLocation: { city: form.city || null, state: form.state || null },
        summary: form.summary || null,
        domain: form.domains[0] ?? null, subDomain: form.domains[1] ?? null,
      });
      onSaved(next);
      if (settings && (form.headline !== (settings.settings.headline ?? '') || form.visibility !== settings.profileVisibility)) {
        onSettings(await patchProfileSettings({ profileVisibility: form.visibility, profileSettings: { headline: form.headline } }));
      }
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof SeekerApiError || err instanceof PublicProfileApiError ? err.message : 'Could not save. Check your connection and try again.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <PaneHead title="Basic information" dirty={dirty} saving={saving} savedAt={savedAt} onSave={() => void save()} />
      <div className="pfx-sec__body">
        {error && <PaneError message={error} onDismiss={() => setError(null)} />}

        <Field label="Photo"><AvatarField /></Field>

        <Field label="Profile visibility" hint="Contact details stay hidden either way, unless you turn them on in Public profile.">
          <VisibilityMenu value={form.visibility} onChange={v => set('visibility', v)} />
        </Field>

        <Field label="Full name"><TextInput value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Your name as it should appear" autoComplete="name" /></Field>

        <Field label="Headline" count={`${form.headline.length}/${HEADLINE_MAX}`} hint="One line under your name. Say what you do, not your job title.">
          <TextInput value={form.headline} maxLength={HEADLINE_MAX} onChange={e => set('headline', e.target.value)} placeholder="Backend engineer who ships payments at scale" />
        </Field>

        <Field label="About" count={`${form.summary.length}/${ABOUT_MAX}`} hint="Two or three lines. What you build, what you are good at, what you want next.">
          <TextArea rows={4} maxLength={ABOUT_MAX} value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="I build the boring, load-bearing parts of products: auth, billing, queues. I like them to stay boring." />
        </Field>

        <Field label="Domains" hint="Up to two. A design engineer is both Design and Engineering. They decide which roles we match you to. With two chosen, tapping a third swaps out the oldest.">
          <Pills options={DOMAINS} value={form.domains} max={2} icons={ICONS}
            onToggle={d => set('domains', form.domains.includes(d) ? form.domains.filter(x => x !== d) : [...form.domains, d].slice(0, 2))}
            onReplace={next => set('domains', next)} />
        </Field>

        <div className="pf-row">
          <Field label="City"><TextInput value={form.city} onChange={e => set('city', e.target.value)} placeholder="Bengaluru" autoComplete="address-level2" /></Field>
          <Field label="State"><TextInput value={form.state} onChange={e => set('state', e.target.value)} placeholder="Karnataka" autoComplete="address-level1" /></Field>
        </div>

        <div className="pf-row">
          <Field label="Email" hint="Never shown unless you turn it on in Public profile."><TextInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
          <Field label="Phone" hint="Same. Off by default."><TextInput value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91" autoComplete="tel" inputMode="tel" /></Field>
        </div>
      </div>
    </>
  );
}
