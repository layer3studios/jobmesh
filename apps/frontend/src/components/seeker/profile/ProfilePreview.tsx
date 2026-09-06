'use client';
// FILE: src/components/seeker/profile/ProfilePreview.tsx
// The live preview beside the editor: what a recruiter opens at /u/{slug}.
// It re-renders from the same profile object the editor saves, so a change on
// the left is on the right the moment it lands.
import { Briefcase, MapPin, AtSign, ExternalLink, Share2, Linkedin, Github, Globe, Mail } from 'lucide-react';
import { Button, useToast } from '../../ui';
import type { ParsedProfile } from '../../../types/seeker-profile';
import type { PublicProfileSettingsState } from '../../../types/public-profile';
import { copyToClipboard } from '../../../lib/clipboard';

interface Props {
  profile: ParsedProfile;
  settings: PublicProfileSettingsState | null;
  avatarUrl?: string | null;
  githubUser?: string | null;
}

function dateRange(start: string | null, end: string | null, isCurrent: boolean) {
  const to = isCurrent ? 'Present' : (end || '');
  return [start, to].filter(Boolean).join(' – ');
}

export default function ProfilePreview({ profile, settings, avatarUrl, githubUser }: Props) {
  const { showToast } = useToast();
  const name = profile.fullName || 'Your name';
  const headline = settings?.settings.headline || [profile.seniorityLevel, profile.domain].filter(Boolean).join(' ') || 'Add a headline';
  const location = [profile.currentLocation?.city, profile.currentLocation?.state].filter(Boolean).join(', ');
  const url = settings?.profilePublic ? settings.profileUrl : null;
  const initial = (profile.fullName || '?').trim().charAt(0).toUpperCase();

  const share = async () => {
    if (!url) { showToast('info', 'Turn on your public profile first — it is in the last tab.'); return; }
    const ok = await copyToClipboard(url);
    showToast(ok ? 'success' : 'error', ok ? 'Link copied' : 'Could not copy the link');
  };

  return (
    <aside className="glass pf-pane pf-preview" aria-label="Live preview">
      <div className="pf-pane__head">
        <span className="ws-section__label">Live preview</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button as="a" href={url ?? undefined} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" aria-disabled={!url} style={!url ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <ExternalLink size={13} /> View
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void share()}><Share2 size={13} /> Share</Button>
        </div>
      </div>

      <div className="pf-card">
        <div className="pf-card__banner" aria-hidden />
        <div className="pf-card__id">
          <div className="pf-card__avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initial}
          </div>
          <h2 className="font-display pf-card__name">{name}</h2>
          <div className="pf-card__meta">
            <span><Briefcase size={12} />{headline}</span>
            {settings?.profileSlug && <span><AtSign size={12} />{settings.profileSlug}</span>}
            {location && <span><MapPin size={12} />{location}</span>}
          </div>
          {settings?.settings.openToWork && <p className="pf-card__open" style={{ marginTop: 10 }}>Open to work</p>}
        </div>

        <div className="pf-block">
          <p className="pf-block__title">About</p>
          {profile.summary
            ? <p className="pf-block__text">{profile.summary}</p>
            : <p className="pf-block__empty">Two lines about what you build and what you want next.</p>}
        </div>

        <div className="pf-block">
          <p className="pf-block__title">Skills</p>
          {profile.skills.length > 0
            ? <div className="pf-chips">{profile.skills.slice(0, 14).map(s => <span key={s.name} className="pf-chip">{s.name}</span>)}{profile.skills.length > 14 && <span className="pf-chip">+{profile.skills.length - 14}</span>}</div>
            : <p className="pf-block__empty">No skills yet.</p>}
        </div>

        {profile.experience.length > 0 && (
          <div className="pf-block">
            <p className="pf-block__title">Experience</p>
            <div className="pf-timeline">
              {profile.experience.slice(0, 3).map((e, i) => (
                <div key={`${e.company}-${i}`} className="pf-tl">
                  <div className="pf-tl__when">{dateRange(e.startDate, e.endDate, e.isCurrent)}</div>
                  <div>
                    <div className="pf-tl__what">{e.title || 'Role'}</div>
                    <div className="pf-tl__where">{e.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pf-block">
          <p className="pf-block__title">Links</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="pf-social" href={profile.linkedinUrl ?? undefined} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" aria-disabled={!profile.linkedinUrl}><Linkedin size={15} /></a>
            <a className="pf-social" href={githubUser ? `https://github.com/${githubUser}` : undefined} target="_blank" rel="noopener noreferrer" aria-label="GitHub" aria-disabled={!githubUser}><Github size={15} /></a>
            <a className="pf-social" href={profile.email && settings?.settings.showEmail ? `mailto:${profile.email}` : undefined} aria-label="Email" aria-disabled={!(profile.email && settings?.settings.showEmail)}><Mail size={15} /></a>
            <a className="pf-social" href={url ?? undefined} target="_blank" rel="noopener noreferrer" aria-label="Public profile" aria-disabled={!url}><Globe size={15} /></a>
          </div>
        </div>
      </div>
    </aside>
  );
}
