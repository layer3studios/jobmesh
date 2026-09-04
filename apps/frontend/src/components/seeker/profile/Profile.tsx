'use client';
// FILE: src/components/seeker/profile/Profile.tsx
// Seeker profile page (/profile). Fetches the parsed profile on mount; shows an
// upload CTA when none exists, otherwise composes the editable + read-only section
// cards. Each editable section PATCHes itself and hands the updated profile back
// up so the page state stays the server-of-truth.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Alert, Stack, SkeletonCard, EmptyState } from '../../ui';
import SeekerWorkspace from '../SeekerWorkspace';
import { fetchProfile, SeekerApiError } from '../../../api/seeker-api';
import type { ParsedProfile } from '../../../types/seeker-profile';
import ProfileContact from './ProfileContact';
import ProfileSkills from './ProfileSkills';
import LeetCodeConnect from './LeetCodeConnect';
import GitHubConnect from './GitHubConnect';
import ProfilePreferences from './ProfilePreferences';
import ProfileSettingsCard from './ProfileSettingsCard';
import ProfileShareButton from './ProfileShareButton';
import { ProfileExperience, ProfileEducation } from './ProfileReadonly';
import ProfileReviewCard from '../ProfileReviewCard';
import ProfileMarketCard from '../ProfileMarketCard';

type LoadState = 'loading' | 'loaded' | 'empty' | 'error';

// profileUpdatedAt lives on the seeker user doc (F3a helpers), not inside the
// parsedProfile envelope; read it defensively and fall back to parsedAt.
type ProfileWithMeta = ParsedProfile & { profileUpdatedAt?: string | null };

function relTime(iso: string | null): string {
  if (!iso) return 'recently';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function Profile() {
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState('Could not load your profile.');

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

  if (loadState === 'loading') {
    return <SeekerWorkspace label="Seeker" title="Your profile"><SkeletonCard lines={5} /></SeekerWorkspace>;
  }
  if (loadState === 'error') {
    return (
      <SeekerWorkspace label="Seeker" title="Your profile">
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </Stack>
        </Alert>
      </SeekerWorkspace>
    );
  }
  if (loadState === 'empty' || !profile) {
    return (
      <SeekerWorkspace label="Seeker" title="Your profile">
        <EmptyState
          title="No profile yet"
          description="Upload your resume and we'll build a structured profile to match you with jobs."
          action={<Link href="/resume"><Button variant="primary">Upload your resume</Button></Link>}
        />
      </SeekerWorkspace>
    );
  }

  return (
    <SeekerWorkspace
      label={`Seeker · parsed ${relTime(profile.parsedAt)}`}
      title="Your profile"
      actions={(
        <Stack gap={8} dir="row" wrap>
          <ProfileShareButton />
          <Link href="/resume"><Button variant="ghost">Re-upload resume</Button></Link>
        </Stack>
      )}
    >
      <Stack gap={16}>
        {/* Above the review card: the shareable link is the thing a candidate
            comes here to get, and burying it under the resume critique makes it
            a feature people never find. */}
        <ProfileSettingsCard />
        <ProfileReviewCard profileUpdatedAt={(profile as ProfileWithMeta).profileUpdatedAt ?? profile.parsedAt} />
        <ProfileMarketCard />
        <ProfileContact profile={profile} onSaved={setProfile} />
        <ProfileSkills profile={profile} onSaved={setProfile} />
        {/* Directly after skills, because it answers the same question with
            evidence: skills are claimed, this is a record. */}
        <LeetCodeConnect />
        <GitHubConnect />
        <ProfilePreferences profile={profile} onSaved={setProfile} />
        <ProfileExperience profile={profile} />
        <ProfileEducation profile={profile} />
        {profile.certifications.length > 0 && (
          <Card>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>Certifications</h3>
            <Stack gap={4}>
              {profile.certifications.map((c, i) => (
                <p key={`${c.name}-${i}`} style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
                  {[c.name, c.issuer].filter(Boolean).join(' — ')}
                </p>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </SeekerWorkspace>
  );
}
