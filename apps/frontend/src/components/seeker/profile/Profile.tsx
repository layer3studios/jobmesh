'use client';
// FILE: src/components/seeker/profile/Profile.tsx
// Seeker profile (/profile), laid out the way Rightfit lays it out: a
// completeness pill that names the next thing to do, a tab bar of sections,
// "Upload resume" top-right, and two panes — the editor for the open section
// on the left, a live preview of the public profile on the right that follows
// the keyboard. Each pane owns its own Save button and error.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { Button, EmptyState } from '../../ui';
import SeekerWorkspace from '../SeekerWorkspace';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { fetchProfile, getGitHubProfile, getLeetCodeProfile, SeekerApiError } from '../../../api/seeker-api';
import { fetchProfileSettings } from '../../../api/public-profile-api';
import type { ParsedProfile } from '../../../types/seeker-profile';
import type { PublicProfileSettingsState } from '../../../types/public-profile';
import LeetCodeConnect from './LeetCodeConnect';
import GitHubConnect from './GitHubConnect';
import ProfileSettingsCard from './ProfileSettingsCard';
import { ProfileExperience, ProfileEducation } from './ProfileReadonly';
import ProfileReviewCard from '../ProfileReviewCard';
import ProfileMarketCard from '../ProfileMarketCard';
import ProfilePreview from './ProfilePreview';
import ResumeSheet from './ResumeSheet';
import BasicInfoPane from './BasicInfoPane';
import SkillsPane from './SkillsPane';
import PreferencesPane from './PreferencesPane';
import { PROFILE_TABS, isProfileTab, type ProfileTab } from './tabs';
import { profileChecks, completeness } from './completeness';

type LoadState = 'loading' | 'loaded' | 'empty' | 'error';
type ProfileWithMeta = ParsedProfile & { profileUpdatedAt?: string | null };

function relTime(iso: string | null): string {
  if (!iso) return 'recently';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function CompletePill({ pct, onClick }: { pct: number; onClick: () => void }) {
  const r = 9, c = 2 * Math.PI * r;
  return (
    <button type="button" className="pf-complete" data-done={pct >= 100} onClick={onClick} aria-label={`Profile ${pct}% complete — see what is next`}>
      <svg className="pf-complete__ring" viewBox="0 0 22 22" aria-hidden>
        <circle className="pf-complete__track" cx="11" cy="11" r={r} />
        <circle className="pf-complete__fill" cx="11" cy="11" r={r} strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      </svg>
      <span className="jb-count">{pct}% complete</span>
    </button>
  );
}

/** Pane-shaped placeholder while the profile loads. */
function ProfileSkeleton() {
  return (
    <div className="pf-body" aria-busy="true" aria-label="Loading your profile">
      <div className="glass pf-pane">
        <div className="pf-pane__head"><div className="skeleton" style={{ height: 11, width: 120 }} /><div className="skeleton" style={{ height: 30, width: 110, borderRadius: 10 }} /></div>
        <div className="pf-pane__body">
          <div className="pf-row"><div className="skeleton" style={{ height: 42, borderRadius: 10 }} /><div className="skeleton" style={{ height: 42, borderRadius: 10 }} /></div>
          <div className="skeleton" style={{ height: 96, borderRadius: 10 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[80, 64, 92, 70, 58].map((w, i) => <div key={i} className="skeleton" style={{ height: 30, width: w, borderRadius: 999 }} />)}</div>
        </div>
      </div>
      <div className="glass pf-pane">
        <div className="skeleton" style={{ height: 120, borderRadius: 0 }} />
        <div style={{ padding: 18, display: 'grid', gap: 10 }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 16, marginTop: -48 }} />
          <div className="skeleton" style={{ height: 26, width: '60%' }} />
          <div className="skeleton" style={{ height: 12, width: '80%' }} />
        </div>
      </div>
    </div>
  );
}

type Draft = { fullName: string; summary: string; city: string; state: string; headline: string; domains: string[] };

export default function Profile() {
  const { currentUser } = useSeeker();
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState('Could not load your profile.');
  const [settings, setSettings] = useState<PublicProfileSettingsState | null>(null);
  const [proof, setProof] = useState<{ github: string | null; leetcode: boolean }>({ github: null, leetcode: false });
  const [tab, setTab] = useState<ProfileTab>('basic');
  const [showNext, setShowNext] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftSkills, setDraftSkills] = useState<string[] | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await fetchProfile();
      setProfile(result);
      setLoadState(result ? 'loaded' : 'empty');
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not load your profile.');
      setLoadState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  // /resume redirects here with ?upload=1: open the sheet straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upload') === '1') {
      setUploadOpen(true);
      history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }, []);
  useEffect(() => {
    fetchProfileSettings().then(setSettings).catch(() => setSettings(null));
    getGitHubProfile().then(r => setProof(p => ({ ...p, github: r.connected ? (r.data?.username ?? '') : null }))).catch(() => {});
    getLeetCodeProfile().then(r => setProof(p => ({ ...p, leetcode: r.connected }))).catch(() => {});
  }, []);

  // The open tab lives in the hash so a link can point at a section.
  useEffect(() => {
    const fromHash = () => { const h = window.location.hash.slice(1); if (isProfileTab(h)) setTab(h); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  const go = (t: ProfileTab) => { setTab(t); history.replaceState(null, '', `#${t}`); setDraft(null); setDraftSkills(null); };

  const onDraft = useCallback((d: Draft) => setDraft(d), []);
  const onDraftSkills = useCallback((s: string[]) => setDraftSkills(s), []);

  const checks = useMemo(() => profile ? profileChecks(profile, { github: !!proof.github, leetcode: proof.leetcode, publicOn: settings?.profilePublic }) : [], [profile, proof, settings]);
  const done = useMemo(() => completeness(checks), [checks]);

  // What the preview shows: the saved profile, overlaid with whatever is being typed.
  const previewProfile = useMemo<ParsedProfile | null>(() => {
    if (!profile) return null;
    let p = profile;
    if (draft) p = { ...p, fullName: draft.fullName || null, summary: draft.summary || null, currentLocation: { city: draft.city || null, state: draft.state || null }, domain: draft.domains[0] ?? null, subDomain: draft.domains[1] ?? null };
    if (draftSkills) p = { ...p, skills: draftSkills.map(name => ({ name, category: null, proficiency: null })) };
    return p;
  }, [profile, draft, draftSkills]);
  const previewSettings = useMemo(() => settings && draft ? { ...settings, settings: { ...settings.settings, headline: draft.headline } } : settings, [settings, draft]);

  if (loadState === 'loading') {
    return <SeekerWorkspace label="Seeker" title="Your profile"><ProfileSkeleton /></SeekerWorkspace>;
  }
  if (loadState === 'error') {
    return (
      <SeekerWorkspace label="Seeker" title="Your profile">
        <div className="jb-error rise" role="alert">
          <p className="jb-error__title">Couldn’t load your profile</p>
          <p className="jb-error__body">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => void load()} iconLeft={<RefreshCw size={13} />}>Try again</Button>
        </div>
      </SeekerWorkspace>
    );
  }
  if (loadState === 'empty' || !profile || !previewProfile) {
    return (
      <SeekerWorkspace label="Seeker" title="Your profile">
        <EmptyState
          title="Start with your resume"
          description="Upload it once. We turn it into a profile — skills, experience, education — that you edit here and recruiters read in one link."
          action={<Button variant="primary" iconLeft={<Upload size={14} />} onClick={() => setUploadOpen(true)}>Upload your resume</Button>}
        />
        <ResumeSheet isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onParsed={() => void load()} />
      </SeekerWorkspace>
    );
  }

  const counts: Partial<Record<ProfileTab, number>> = {
    experience: profile.experience.length, education: profile.education.length, skills: profile.skills.length,
  };
  const unmetTabs = new Set(checks.filter(c => !c.met).map(c => c.tab));
  const paneTitle = PROFILE_TABS.find(t => t.id === tab)?.label ?? '';

  const pane = (() => {
    switch (tab) {
      case 'basic': return (
        <BasicInfoPane
          profile={profile} settings={settings}
          avatar={currentUser ? { name: currentUser.name, picture: currentUser.picture } : undefined}
          onSaved={setProfile} onSettings={setSettings} onDraft={onDraft}
        />
      );
      case 'skills': return <SkillsPane profile={profile} onSaved={setProfile} onDraft={onDraftSkills} />;
      case 'preferences': return <PreferencesPane profile={profile} onSaved={setProfile} />;
      case 'experience': return (<><div className="pf-pane__head"><span className="ws-section__label">Experience · {profile.experience.length}</span></div><div className="pf-pane__body"><ProfileExperience profile={profile} /></div></>);
      case 'education': return (
        <>
          <div className="pf-pane__head"><span className="ws-section__label">Education · {profile.education.length}</span></div>
          <div className="pf-pane__body">
            <ProfileEducation profile={profile} />
            {profile.certifications.length > 0 && (
              <div>
                <p className="pf-field__label" style={{ marginBottom: 8 }}>Certifications</p>
                <div className="pf-chips">{profile.certifications.map((c, i) => <span key={`${c.name}-${i}`} className="pf-chip">{[c.name, c.issuer].filter(Boolean).join(' — ')}</span>)}</div>
              </div>
            )}
          </div>
        </>
      );
      case 'proof': return (
        <>
          <div className="pf-pane__head"><span className="ws-section__label">Proof of work</span><span className="ws-section__sub">Claims get read. Evidence gets replies.</span></div>
          <div className="pf-pane__body"><GitHubConnect /><LeetCodeConnect /><ProfileReviewCard profileUpdatedAt={(profile as ProfileWithMeta).profileUpdatedAt ?? profile.parsedAt} /><ProfileMarketCard /></div>
        </>
      );
      case 'settings': return (
        <>
          <div className="pf-pane__head"><span className="ws-section__label">{paneTitle}</span></div>
          <div className="pf-pane__body"><ProfileSettingsCard /></div>
        </>
      );
    }
  })();

  return (
    <SeekerWorkspace
      label={`Seeker · parsed ${relTime(profile.parsedAt)}`}
      title="Your profile"
      actions={<Button variant="secondary" iconLeft={<Upload size={14} />} onClick={() => setUploadOpen(true)}>Upload resume</Button>}
    >
      <ResumeSheet isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onParsed={() => void load()} />
      <div className="pf-bar">
        <CompletePill pct={done.pct} onClick={() => setShowNext(v => !v)} />
        <div className="pf-tabs" role="tablist" aria-label="Profile sections">
          {PROFILE_TABS.map(t => (
            <button
              key={t.id} type="button" role="tab" id={`pf-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="pf-panel"
              className="pf-tab" onClick={() => go(t.id)}
            >
              {t.label}
              {counts[t.id] ? <span className="pf-tab__count">{counts[t.id]}</span> : unmetTabs.has(t.id) && <span className="pf-tab__dot" aria-label="Needs attention" />}
            </button>
          ))}
        </div>
      </div>

      {showNext && done.next.length > 0 && (
        <div className="pf-next rise" role="status">
          <p className="pf-next__title">{done.met} of {checks.length} done. Next:</p>
          {done.next.map(c => (
            <div key={c.key} className="pf-next__item">
              <span className="pf-next__dot" aria-hidden />
              {c.action}
              <Button size="sm" variant="ghost" onClick={() => { go(c.tab); setShowNext(false); }}>Go</Button>
            </div>
          ))}
        </div>
      )}

      <div className="pf-body">
        <section id="pf-panel" role="tabpanel" aria-labelledby={`pf-tab-${tab}`} className="glass pf-pane pf-editor--flat">
          <div key={tab} className="jb-swap">{pane}</div>
        </section>
        <ProfilePreview profile={previewProfile} settings={previewSettings} avatarUrl={currentUser?.picture} githubUser={proof.github} />
      </div>
    </SeekerWorkspace>
  );
}
