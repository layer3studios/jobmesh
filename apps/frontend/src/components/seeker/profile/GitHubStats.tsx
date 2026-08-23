'use client';
// FILE: src/components/seeker/profile/GitHubStats.tsx
// The whole GitHub panel, shown identically to the candidate on their profile and
// to the employer in the applicant modal.
//
// ONE COMPONENT FOR BOTH AUDIENCES, deliberately: what a candidate sees is exactly
// what a recruiter sees, so there is no version of this where the numbers are
// dressed up for one side. It takes already-shaped data and renders it — no
// fetching, no state beyond the mount animation.
//
// IT DELIBERATELY MIRRORS LeetCodeStats — same stat tiles, same language bar, same
// heatmap, same section headings. A recruiter who has read one panel can read the
// other without relearning it, and the shared .lc-* classes are what keep the two
// from drifting apart.
//
// Sections render only when they have something to say. An account with no repos,
// no detected languages or no pins gets a shorter panel rather than empty headings.

import { useEffect, useState } from 'react';
import { GitCommitHorizontal, GitPullRequest, CircleAlert, Eye } from 'lucide-react';
import type { GitHubProfile } from '@/types/seeker-profile';
import ContributionHeatmap from './ContributionHeatmap';
import GitHubRepoGrid from './GitHubRepoGrid';

/** The design system's categorical set, cycled — the fallback when GitHub has no
    colour for a language (it returns null for a few). */
const FALLBACK_COLORS = [
  'var(--cat-blue)', 'var(--cat-green)', 'var(--cat-purple)',
  'var(--cat-amber)', 'var(--cat-indigo)', 'var(--cat-orange)',
];

const BREAKDOWN = [
  { key: 'totalCommits', label: 'Commits', Icon: GitCommitHorizontal },
  { key: 'totalPullRequests', label: 'Pull requests', Icon: GitPullRequest },
  { key: 'totalIssues', label: 'Issues', Icon: CircleAlert },
  { key: 'totalReviews', label: 'Reviews', Icon: Eye },
] as const;

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="lc-stat">
      <div className={`lc-stat-value${accent ? ' lc-stat-value--accent' : ''}`}>{value}</div>
      <p className="lc-stat-label">{label}</p>
    </div>
  );
}

export default function GitHubStats({ data }: { data: GitHubProfile }) {
  // The bar starts at zero and is widened one tick after mount, so the transition
  // has a from-state to animate. Reduced motion is handled in CSS, not here — the
  // final width is correct either way.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const languageTotal = data.languages.reduce((sum, language) => sum + language.repoCount, 0);
  const colorFor = (index: number, color: string | null) =>
    color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="lc-stat-row">
        <Stat value={data.publicRepoCount.toLocaleString()} label="Repositories" />
        <Stat value={data.totalStars.toLocaleString()} label="Stars" accent />
        <Stat value={data.totalContributions.toLocaleString()} label="Contributions" />
        <Stat value={data.totalPullRequests.toLocaleString()} label="Pull requests" />
      </div>

      <section>
        <h4 className="lc-section-heading">Past year</h4>
        <div className="gh-breakdown">
          {BREAKDOWN.map(({ key, label, Icon }) => (
            <div className="gh-breakdown-item" key={key}>
              <Icon size={15} className="gh-breakdown-icon" aria-hidden="true" />
              <div className="gh-breakdown-text">
                <div className="gh-breakdown-value">{data[key].toLocaleString()}</div>
                <p className="gh-breakdown-label">{label}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Only when there is something to explain. A thin heatmap under a strong
            commit total otherwise reads as inactivity, when in fact the work is
            simply in private repos the candidate chose to count but not name. */}
        {data.privateContributions > 0 && (
          <p style={{ margin: '7px 0 0', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
            Includes {data.privateContributions.toLocaleString()} contributions in private
            repositories.
          </p>
        )}
      </section>

      {languageTotal > 0 && (
        <section>
          <h4 className="lc-section-heading">Languages</h4>
          <div className="lc-lang-bar">
            {data.languages.map((language, index) => (
              <div
                key={language.name}
                title={`${language.name}: ${language.repoCount} repositories`}
                style={{
                  width: grown ? `${(language.repoCount / languageTotal) * 100}%` : 0,
                  background: colorFor(index, language.color),
                  transition: 'width 0.6s ease-out',
                }}
              />
            ))}
          </div>
          <div className="lc-lang-legend">
            {data.languages.map((language, index) => (
              <span className="lc-lang-legend-item" key={language.name}>
                <span
                  className="lc-lang-swatch"
                  style={{ background: colorFor(index, language.color) }}
                />
                {language.name}
                <span style={{ color: 'var(--ink-faint)' }}>{language.repoCount}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <GitHubRepoGrid pinned={data.pinnedRepos} top={data.topRepos} />

      {/* alwaysRender: GitHub always sends a real calendar, so an empty grid here
          means a genuinely quiet year rather than missing data — and the empty
          grid says that far better than the section vanishing would. */}
      <ContributionHeatmap
        calendar={data.contributionCalendar}
        heading="Contributions · past year"
        unit="contribution"
        alwaysRender
      />
    </div>
  );
}
