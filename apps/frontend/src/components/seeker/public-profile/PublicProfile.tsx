// FILE: src/components/seeker/public-profile/PublicProfile.tsx
// The whole /u/{slug} page body.
//
// IT REUSES THE VISUALISATIONS, IT DOES NOT REBUILD THEM. LeetCodeStats and
// GitHubStats are the exact components the candidate sees on their own profile
// and an employer sees in the applicant modal, so a number can never differ
// between the three places it appears. This file's job is layout, ordering and
// the actions — nothing about how a heatmap or a difficulty bar draws.
//
// The order is the order a recruiter reads in: who they are, what they claim,
// where they have worked, then the two records that check the claims.
'use client';

import type { PublicProfile as PublicProfileData } from '@/types/public-profile';
import { absoluteUrl } from '@/lib/site-url';
import LeetCodeStats from '../profile/LeetCodeStats';
import GitHubStats from '../profile/GitHubStats';
import PublicProfileHeader from './PublicProfileHeader';
import { PublicSkills, PublicExperience, PublicEducation } from './PublicProfileSections';

function StalePanelNote({ isStale }: { isStale?: boolean }) {
  if (!isStale) return null;
  return (
    <p className="pp-stale">
      These numbers were last read a while ago — the source could not be reached just now.
    </p>
  );
}

export default function PublicProfile({ profile, shareUrl }: {
  profile: PublicProfileData;
  shareUrl: string;
}) {
  return (
    <div className="pp-shell" style={{ position: 'relative' }}>
      <div className="app-ambient" aria-hidden />
      <PublicProfileHeader profile={profile} shareUrl={shareUrl} />

      <PublicSkills profile={profile} />
      <PublicExperience entries={profile.experience} />
      <PublicEducation entries={profile.education} />

      {profile.leetcode && (
        <section className="pp-section">
          <h2 className="pp-section-heading">
            LeetCode ·{' '}
            <a
              href={`https://leetcode.com/u/${profile.leetcode.username}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              @{profile.leetcode.username}
            </a>
          </h2>
          <div className="pp-card">
            <LeetCodeStats data={profile.leetcode.data} />
            <StalePanelNote isStale={profile.leetcode.data.isStale} />
          </div>
        </section>
      )}

      {profile.github && (
        <section className="pp-section">
          <h2 className="pp-section-heading">
            GitHub ·{' '}
            <a
              href={`https://github.com/${profile.github.username}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              @{profile.github.username}
            </a>
          </h2>
          <div className="pp-card">
            <GitHubStats data={profile.github.data} />
            <StalePanelNote isStale={profile.github.data.isStale} />
          </div>
        </section>
      )}

      <footer className="pp-footer">
        <span>
          Powered by <a href={absoluteUrl('/')}>JobMesh</a>
        </span>
        <a href={absoluteUrl('/profile')}>Create your own profile</a>
      </footer>
    </div>
  );
}
