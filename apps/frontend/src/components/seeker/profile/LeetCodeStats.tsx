'use client';
// FILE: src/components/seeker/profile/LeetCodeStats.tsx
// The whole LeetCode panel, shown identically to the candidate on their profile
// and to the employer in the applicant modal.
//
// ONE COMPONENT FOR BOTH AUDIENCES, deliberately: what a candidate sees is exactly
// what a recruiter sees, so there is no version of this where the numbers are
// dressed up for one side. It takes already-shaped data and renders it — no
// fetching, no state beyond the mount animation.
//
// Sections render only when they have something to say. A candidate with no
// contests, no tagged skills or no calendar gets a shorter panel rather than a
// row of empty headings.

import { useEffect, useState } from 'react';
import type { LeetCodeProfile } from '@/types/seeker-profile';
import ContributionHeatmap from './ContributionHeatmap';
import LeetCodeContestChart from './LeetCodeContestChart';

/** Semantic, not literal: these follow the theme instead of being three fixed hues. */
const DIFFICULTY_ROWS = [
  { label: 'Easy', key: 'easySolved', color: 'var(--success)' },
  { label: 'Medium', key: 'mediumSolved', color: 'var(--warning)' },
  { label: 'Hard', key: 'hardSolved', color: 'var(--danger)' },
] as const;

/** The design system's categorical set, cycled. Six is more languages than anyone uses. */
const LANGUAGE_COLORS = [
  'var(--cat-blue)', 'var(--cat-green)', 'var(--cat-purple)',
  'var(--cat-amber)', 'var(--cat-indigo)', 'var(--cat-orange)',
];

const DASH = '—';
const fmt = (value: number | null) => (value == null ? DASH : value.toLocaleString());

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="lc-stat">
      <div className={`lc-stat-value${accent ? ' lc-stat-value--accent' : ''}`}>{value}</div>
      <p className="lc-stat-label">{label}</p>
    </div>
  );
}

export default function LeetCodeStats({ data }: { data: LeetCodeProfile }) {
  // Bars start at zero and are widened one tick after mount, so the transition has
  // a from-state to animate. Reduced motion is handled in CSS, not here — the
  // final width is correct either way.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { totalSolved } = data;
  const hasLanguages = data.languages.length > 0;
  const languageTotal = data.languages.reduce((sum, language) => sum + language.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="lc-stat-row">
        <Stat value={fmt(totalSolved)} label="Problems" />
        <Stat value={fmt(data.contestRating)} label="Rating" accent />
        <Stat value={fmt(data.contestsAttended)} label="Contests" />
        <Stat value={fmt(data.contestGlobalRanking)} label="Ranking" />
      </div>

      <section>
        <h4 className="lc-section-heading">By difficulty</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DIFFICULTY_ROWS.map((row, index) => {
            const count = data[row.key];
            // Share of what they have solved, so the three bars read against each
            // other. An empty account draws three empty tracks, which is honest.
            const share = totalSolved > 0 ? (count / totalSolved) * 100 : 0;
            return (
              <div className="lc-bar-row" key={row.label}>
                <span className="lc-bar-name">{row.label}</span>
                <div className="lc-bar-track">
                  <div
                    className="lc-bar-fill"
                    style={{
                      width: grown ? `${share}%` : 0,
                      background: row.color,
                      ['--lc-bar-delay' as string]: `${index * 90}ms`,
                    }}
                  />
                </div>
                <span className="lc-bar-count">{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </section>

      {data.topSkills.length > 0 && (
        <section>
          <h4 className="lc-section-heading">Strongest topics</h4>
          <div className="pf-topics">
            {data.topSkills.map((skill) => (
              <span key={skill.name} className="pf-topic">
                {skill.name} <span className="pf-topic__n">{skill.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {hasLanguages && (
        <section>
          <h4 className="lc-section-heading">Languages</h4>
          <div className="lc-lang-bar">
            {data.languages.map((language, index) => (
              <div
                key={language.name}
                title={`${language.name}: ${language.count}`}
                style={{
                  width: `${(language.count / languageTotal) * 100}%`,
                  background: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
                }}
              />
            ))}
          </div>
          <div className="lc-lang-legend">
            {data.languages.map((language, index) => (
              <span className="lc-lang-legend-item" key={language.name}>
                <span
                  className="lc-lang-swatch"
                  style={{ background: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length] }}
                />
                {language.name}
                <span style={{ color: 'var(--ink-faint)' }}>{language.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <ContributionHeatmap
        calendar={data.submissionCalendar}
        heading="Activity · past year"
        unit="submission"
      />
      <LeetCodeContestChart data={data} />
    </div>
  );
}
