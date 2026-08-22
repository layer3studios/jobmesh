'use client';
// FILE: src/components/seeker/profile/Profile.tsx
// Seeker profile page (/profile). Fetches the parsed profile on mount; shows an
// upload CTA when none exists, otherwise composes the editable + read-only section
// cards. Each editable section PATCHes itself and hands the updated profile back
// up so the page state stays the server-of-truth.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, Card, Button, Alert, PageHeader, Stack, SkeletonCard, EmptyState } from '../../ui';
import { fetchProfile, SeekerApiError } from '../../../api/seeker-api';
import type { ParsedProfile } from '../../../types/seeker-profile';
import ProfileContact from './ProfileContact';
import ProfileSkills from './ProfileSkills';
import ProfilePreferences from './ProfilePreferences';
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
    return <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}><SkeletonCard lines={5} /></Container>;
  }
  if (loadState === 'error') {
    return (
      <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </Stack>
        </Alert>
      </Container>
    );
  }
  if (loadState === 'empty' || !profile) {
    return (
      <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <PageHeader label="SEEKER" title="Your profile" />
        <EmptyState
          title="No profile yet"
          description="Upload your resume and we'll build a structured profile to match you with jobs."
          action={<Link href="/resume"><Button variant="primary">Upload your resume</Button></Link>}
        />
      </Container>
    );
  }

  return (
    <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader
        label="SEEKER"
        title="Your profile"
        subtitle={`Last parsed ${relTime(profile.parsedAt)}`}
        actions={<Link href="/resume"><Button variant="ghost">Re-upload resume</Button></Link>}
      />
      <Stack gap={16}>
        <ProfileReviewCard profileUpdatedAt={(profile as ProfileWithMeta).profileUpdatedAt ?? profile.parsedAt} />
        <ProfileMarketCard />
        <ProfileContact profile={profile} onSaved={setProfile} />
        <ProfileSkills profile={profile} onSaved={setProfile} />
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
    </Container>
  );
}
