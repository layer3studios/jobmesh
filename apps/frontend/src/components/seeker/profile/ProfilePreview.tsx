'use client';
// FILE: src/components/seeker/profile/ProfilePreview.tsx
// The live preview beside the editor: what a recruiter opens at /u/{slug}.
// It re-renders from the same profile object the editor saves, so a change
// on the left is on the right the moment it lands. Every link in it is real
// when the data exists; when it does not, the same chip jumps to the section
// that fills it in.
import { Briefcase, MapPin, AtSign, ExternalLink, Share2, Linkedin, Github, Code2, Mail, Plus } from 'lucide-react';
import { Button, useToast } from '../../ui';
import type { ParsedProfile } from '../../../types/seeker-profile';
import type { PublicProfileSettingsState } from '../../../types/public-profile';
import { copyToClipboard } from '../../../lib/clipboard';
import type { ProfileTab } from './tabs';

interface Props {
  profile: ParsedProfile;
  settings: PublicProfileSettingsState | null;
  avatarUrl?: string | null;
  githubUser?: string | null;
  leetcodeUser?: string | null;
  onJump: (tab: ProfileTab) => void;
}

function dateRange(start: string | null, end: string | null, isCurrent: boolean) {
  const to = isCurrent ? 'Present' : (end || '');
  return [start, to].filter(Boolean).join(' – ');
}

/** A link in the preview: a real anchor when the data exists, a jump to the editor when it does not. */
function LinkChip({ href, label, icon, missingTab, onJump }: { href: string | null; label: string; icon: React.ReactNode; missingTab: ProfileTab; onJump: (t: ProfileTab) => void }) {
  if (href) {
    return <a className="pfx-link press" href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">{icon}{label}<ExternalLink size={11} className="pfx-link__ext" aria-hidden /></a>;
  }
  return <button type="button" className="pfx-link pfx-link--add press" onClick={() => onJump(missingTab)} title={`Add ${label}`}>{icon}{label}<Plus size={11} aria-hidden /></button>;
}

export default function ProfilePreview({ profile, settings, avatarUrl, githubUser, leetcodeUser, onJump }: Props) {
  const { showToast } = useToast();
  const name = profile.fullName || 'Your name';
  const headline = settings?.settings.headline || [profile.seniorityLevel, profile.domain].filter(Boolean).join(' ') || 'Add a headline';
  const location = [profile.currentLocation?.city, profile.currentLocation?.state].filter(Boolean).join(', ');
  const url = settings?.profilePublic ? settings.profileUrl ?? null : null;
  const initial = (profile.fullName || '?').trim().charAt(0).toUpperCase();

  const view = () => {
    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
    showToast('info', 'Your page is private. Turn it on in Public profile and View opens it.');
    onJump('settings');
  };
  const share = async () => {
    if (!url) { showToast('info', 'Turn on your public profile first, then share the link.'); onJump('settings'); return; }
    const ok = await copyToClipboard(url);
    showToast(ok ? 'success' : 'error', ok ? 'Link copied' : 'Could not copy the link');
  };

  return (
    <aside className="glass pf-pane pf-preview" aria-label="Live preview">
      <div className="pf-pane__head">
        <span className="ws-section__label">Live preview</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={view} iconLeft={<ExternalLink size={13} />}>View</Button>
          <Button variant="secondary" size="sm" onClick={() => void share()} iconLeft={<Share2 size={13} />}>Share</Button>
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
          <p className="pf-block__title">Links</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <LinkChip href={profile.linkedinUrl} label="LinkedIn" icon={<Linkedin size={13} />} missingTab="proof" onJump={onJump} />
            <LinkChip href={githubUser ? `https://github.com/${githubUser}` : null} label="GitHub" icon={<Github size={13} />} missingTab="proof" onJump={onJump} />
            <LinkChip href={leetcodeUser ? `https://leetcode.com/u/${leetcodeUser}` : null} label="LeetCode" icon={<Code2 size={13} />} missingTab="proof" onJump={onJump} />
            <LinkChip href={profile.email && settings?.settings.showEmail ? `mailto:${profile.email}` : null} label="Email" icon={<Mail size={13} />} missingTab={profile.email ? 'settings' : 'basic'} onJump={onJump} />
          </div>
        </div>

        <div className="pf-block">
          <p className="pf-block__title">About</p>
          {profile.summary
            ? <p className="pf-block__text">{profile.summary}</p>
            : <button type="button" className="pf-block__empty--btn press" onClick={() => onJump('basic')}>Two lines about what you build and what you want next. <Plus size={11} aria-hidden /></button>}
        </div>

        <div className="pf-block">
          <p className="pf-block__title">Skills</p>
          {profile.skills.length > 0
            ? <div className="pf-chips">{profile.skills.slice(0, 14).map(s => <span key={s.name} className="pf-chip">{s.name}</span>)}{profile.skills.length > 14 && <span className="pf-chip">+{profile.skills.length - 14}</span>}</div>
            : <button type="button" className="pf-block__empty--btn press" onClick={() => onJump('skills')}>No skills yet. <Plus size={11} aria-hidden /></button>}
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
            {profile.experience.length > 3 && <p className="pf-block__more">+{profile.experience.length - 3} more on the page</p>}
          </div>
        )}
      </div>
    </aside>
  );
}
