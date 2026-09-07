'use client';
// FILE: src/components/seeker/profile/Profile.tsx
// Seeker profile (/profile), set like the other account pages: a masthead
// that says how complete it is, then three columns at width. Left, the
// section index with what still needs doing. Middle, the editor for the open
// section: hairline sections, one Save each. Right, the live preview of the
// public page, whose links are real and whose gaps jump you to the field.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload, RefreshCw, ExternalLink, ArrowRight, Check } from 'lucide-react';
import { Button, EmptyState, useToast } from '../../ui';
import SeekerWorkspace from '../SeekerWorkspace';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { fetchProfile, getGitHubProfile, getLeetCodeProfile, SeekerApiError } from '../../../api/seeker-api';
import { fetchProfileSettings } from '../../../api/public-profile-api';
import type { ParsedProfile } from '../../../types/seeker-profile';
import type { PublicProfileSettingsState } from '../../../types/public-profile';
import LeetCodeConnect from './LeetCodeConnect';
import GitHubConnect from './GitHubConnect';
import LinkedInConnect from './LinkedInConnect';
import ProfileSettingsCard from './ProfileSettingsCard';
import { ProfileExperience, ProfileEducation } from './ProfileReadonly';
import ProfileReviewCard from '../ProfileReviewCard';
import ProfileMarketCard from '../ProfileMarketCard';
import ProfilePreview from './ProfilePreview';
import ResumeSheet from './ResumeSheet';
import BasicInfoPane from './BasicInfoPane';
import SkillsPane from './SkillsPane';
import PreferencesPane from './PreferencesPane';
import { SectionHead } from './editor';
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

/** Placeholder while the profile loads: the same three columns. */
function ProfileSkeleton() {
  return (
    <div className="pfx" aria-busy="true" aria-label="Loading your profile">
      <div className="pfx__nav">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36, width: 120, borderRadius: 9, opacity: 1 - i * 0.1 }} />)}</div>
      <div className="pfx__editor">
        <div className="pfx-sec__head"><div className="skeleton" style={{ height: 30, width: 220 }} /><div className="skeleton" style={{ height: 30, width: 110, borderRadius: 10 }} /></div>
        <div className="pfx-sec__body">
          <div className="pf-row"><div className="skeleton" style={{ height: 42, borderRadius: 10 }} /><div className="skeleton" style={{ height: 42, borderRadius: 10 }} /></div>
          <div className="skeleton" style={{ height: 96, borderRadius: 10 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[80, 64, 92, 70, 58].map((w, i) => <div key={i} className="skeleton" style={{ height: 30, width: w, borderRadius: 999 }} />)}</div>
        </div>
      </div>
      <div className="skeleton" style={{ height: 420, borderRadius: 14 }} />
    </div>
  );
}

type Draft = { fullName: string; summary: string; city: string; state: string; headline: string; domains: string[] };

export default function Profile() {
  const { currentUser } = useSeeker();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState('Could not load your profile.');
  const [settings, setSettings] = useState<PublicProfileSettingsState | null>(null);
  const [proof, setProof] = useState<{ github: string | null; leetcode: string | null }>({ github: null, leetcode: null });
  const [tab, setTab] = useState<ProfileTab>('basic');
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
  const loadProof = useCallback(() => {
    getGitHubProfile().then(r => setProof(p => ({ ...p, github: r.connected ? (r.data?.username ?? '') : null }))).catch(() => {});
    getLeetCodeProfile().then(r => setProof(p => ({ ...p, leetcode: r.connected ? (r.data?.username ?? '') : null }))).catch(() => {});
  }, []);
  useEffect(() => {
    fetchProfileSettings().then(setSettings).catch(() => setSettings(null));
    loadProof();
  }, [loadProof]);
  // The proof section changes connections; re-read them when it is left.
  useEffect(() => { if (tab !== 'proof') loadProof(); }, [tab, loadProof]);
  // The settings section owns the public switch; re-read it when it is left.
  useEffect(() => { if (tab !== 'settings') fetchProfileSettings().then(setSettings).catch(() => {}); }, [tab]);

  // The open section lives in the hash so a link can point at it.
  useEffect(() => {
    const fromHash = () => { const h = window.location.hash.slice(1); if (isProfileTab(h)) setTab(h); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  const go = useCallback((t: ProfileTab) => {
    setTab(t); history.replaceState(null, '', `#${t}`); setDraft(null); setDraftSkills(null);
    document.getElementById('pfx-editor')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  const onDraft = useCallback((d: Draft) => setDraft(d), []);
  const onDraftSkills = useCallback((s: string[]) => setDraftSkills(s), []);

  const checks = useMemo(() => profile ? profileChecks(profile, { github: !!proof.github, leetcode: !!proof.leetcode, publicOn: settings?.profilePublic }) : [], [profile, proof, settings]);
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

  const publicUrl = settings?.profilePublic ? settings.profileUrl : null;
  const viewPublic = () => {
    if (publicUrl) { window.open(publicUrl, '_blank', 'noopener,noreferrer'); return; }
    showToast('info', 'Your page is private. Turn it on in Public profile and this opens it.');
    go('settings');
  };

  if (loadState === 'loading') {
    return <SeekerWorkspace label="Your profile" title="Loading"><ProfileSkeleton /></SeekerWorkspace>;
  }
  if (loadState === 'error') {
    return (
      <SeekerWorkspace label="Your profile" title="Could not load">
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
      <SeekerWorkspace label="Your profile" title="Start with your resume" lede="Upload it once. We turn it into a profile that recruiters read in one link.">
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
  const doneTabs = new Set(PROFILE_TABS.filter(t => checks.some(c => c.tab === t.id) && !unmetTabs.has(t.id)).map(t => t.id));

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
      case 'experience': return (
        <>
          <SectionHead title="Experience" sub={`${profile.experience.length} ${profile.experience.length === 1 ? 'role' : 'roles'} from your resume. Upload a newer one to change them.`} right={<Button variant="secondary" size="sm" iconLeft={<Upload size={13} />} onClick={() => setUploadOpen(true)}>Upload resume</Button>} />
          <div className="pfx-sec__body"><ProfileExperience profile={profile} /></div>
        </>
      );
      case 'education': return (
        <>
          <SectionHead title="Education" sub={`${profile.education.length} from your resume.`} right={<Button variant="secondary" size="sm" iconLeft={<Upload size={13} />} onClick={() => setUploadOpen(true)}>Upload resume</Button>} />
          <div className="pfx-sec__body">
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
          <SectionHead title="Proof of work" sub="Claims get read. Evidence gets replies. Each connection becomes a button on your public page." />
          <div className="pfx-sec__body">
            <GitHubConnect />
            <LeetCodeConnect />
            <LinkedInConnect profile={profile} onSaved={setProfile} />
            <div className="pfx-sec__group">
              <p className="pfx-sec__group-title">Read on your resume</p>
              <ProfileReviewCard profileUpdatedAt={(profile as ProfileWithMeta).profileUpdatedAt ?? profile.parsedAt} />
              <ProfileMarketCard />
            </div>
          </div>
        </>
      );
      case 'settings': return (
        <>
          <SectionHead title="Public profile" sub="One link that replaces your resume for cold outreach." right={publicUrl ? <Button variant="secondary" size="sm" iconLeft={<ExternalLink size={13} />} onClick={viewPublic}>Open page</Button> : undefined} />
          <div className="pfx-sec__body"><ProfileSettingsCard /></div>
        </>
      );
    }
  })();

  return (
    <SeekerWorkspace
      label={`Your profile · parsed ${relTime(profile.parsedAt)}`}
      title={done.pct >= 100 ? 'Ready to be read' : `${done.pct}% of the way there`}
      lede={done.pct >= 100 ? 'Everything a recruiter needs is here. Keep it current.' : `${done.next[0]?.action ?? 'Fill the gaps'} and this reads like a finished profile.`}
      tally={[
        { value: profile.skills.length, label: profile.skills.length === 1 ? 'skill' : 'skills' },
        { value: profile.experience.length, label: profile.experience.length === 1 ? 'role' : 'roles' },
        { value: profile.education.length, label: 'education' },
        { value: `${done.met}/${checks.length}`, label: 'complete' },
      ]}
      actions={
        <>
          <Button variant="secondary" iconLeft={<ExternalLink size={14} />} onClick={viewPublic}>{publicUrl ? 'View public page' : 'Preview is private'}</Button>
          <Button variant="primary" iconLeft={<Upload size={14} />} onClick={() => setUploadOpen(true)}>Upload resume</Button>
        </>
      }
    >
      <ResumeSheet isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onParsed={() => void load()} />

      <div className="pfx">
        <nav className="pfx__nav" role="tablist" aria-label="Profile sections">
          {PROFILE_TABS.map((t, i) => (
            <button
              key={t.id} type="button" role="tab" id={`pf-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="pfx-editor"
              className="pfx__tab" onClick={() => go(t.id)}
            >
              <span className="pfx__tab-num">{String(i + 1).padStart(2, '0')}</span>
              {t.label}
              <span className="pfx__tab-state">
                {counts[t.id] ? counts[t.id] : null}
                {unmetTabs.has(t.id) ? <span className="pfx__tab-dot" aria-label="Needs attention" /> : doneTabs.has(t.id) ? <Check size={12} className="pfx__tab-done" aria-label="Done" /> : null}
              </span>
            </button>
          ))}
          {done.next.length > 0 && (
            <div className="pfx__next" role="status">
              <p className="pfx__next-title">{done.met} of {checks.length} done · next</p>
              {done.next.map(c => (
                <button key={c.key} type="button" className="pfx__next-item" onClick={() => go(c.tab)}>
                  {c.action} <ArrowRight size={12} aria-hidden />
                </button>
              ))}
            </div>
          )}
        </nav>

        <section id="pfx-editor" role="tabpanel" aria-labelledby={`pf-tab-${tab}`} className="pfx__editor">
          <div key={tab} className="jb-swap pfx-sec">{pane}</div>
        </section>

        <ProfilePreview profile={previewProfile} settings={previewSettings} avatarUrl={currentUser?.picture} githubUser={proof.github} leetcodeUser={proof.leetcode} onJump={go} />
      </div>
    </SeekerWorkspace>
  );
}
