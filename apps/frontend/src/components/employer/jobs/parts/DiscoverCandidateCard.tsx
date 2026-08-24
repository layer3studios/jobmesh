'use client';
// FILE: src/components/employer/jobs/parts/DiscoverCandidateCard.tsx
// One suggested candidate: who they are, what they matched, and the one action.
//
// THE CARD BUYS ITS OWN AI REVIEW. An IntersectionObserver fires the request the
// first time the card is actually looked at, so opening the tab costs nothing and
// a recruiter who stops after three candidates pays for three reviews, not ten.
//
// WHAT IS SHOWN IS EVIDENCE, NOT A SCORE. The ranking number never leaves the
// server; the card shows the matched skills and the proof-of-work counts, which
// a recruiter can check against the resume rather than having to trust.

import { useEffect, useRef } from 'react';
import { Code2, Github, FileText, Plus, Check } from 'lucide-react';
import { Button, SkeletonLine } from '@/components/ui';
import type { DiscoverCandidate, DiscoverRating } from '@/types/employer-discover';

const RATING_LABEL: Record<DiscoverRating, string> = {
  strong: 'Strong match', good: 'Good match', possible: 'Possible match',
};

export default function DiscoverCandidateCard({ candidate, onRequestReview, onAdd, isAdding }: {
  candidate: DiscoverCandidate;
  /** Called once, when the card first becomes visible. */
  onRequestReview: (seekerUserId: string) => void;
  onAdd: (seekerUserId: string) => void;
  isAdding: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (candidate.aiReview || requested.current) return;
    const node = cardRef.current;
    if (!node) return;
    // No IntersectionObserver (older browsers, jsdom): ask immediately rather
    // than leaving every card permanently blank.
    if (typeof IntersectionObserver === 'undefined') {
      requested.current = true;
      onRequestReview(candidate.seekerUserId);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || requested.current) return;
      requested.current = true;
      onRequestReview(candidate.seekerUserId);
      observer.disconnect();
    }, { rootMargin: '120px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [candidate.seekerUserId, candidate.aiReview, onRequestReview]);

  const meta = [
    candidate.location,
    typeof candidate.experienceYears === 'number' ? `${candidate.experienceYears} yrs` : null,
  ].filter(Boolean).join(' · ');

  return (
    <article ref={cardRef} className={`dv-card${candidate.addedToPipeline ? ' dv-card--added' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="dv-card__name">{candidate.name ?? 'Candidate'}</p>
          {meta && <p className="dv-card__meta">{meta}</p>}
        </div>
        {candidate.aiRating && (
          <span className={`dv-rating dv-rating--${candidate.aiRating}`}>
            {RATING_LABEL[candidate.aiRating]}
          </span>
        )}
      </div>

      {candidate.matchedSkills.length > 0 && (
        <div>
          <div className="dv-skills">
            {candidate.matchedSkills.slice(0, 8).map((skill) => (
              <span className="dv-skill" key={skill}>{skill}</span>
            ))}
          </div>
          <p className="dv-card__meta" style={{ marginTop: 5 }}>
            Matched {candidate.matchedSkillCount} skill{candidate.matchedSkillCount === 1 ? '' : 's'} on this role
          </p>
        </div>
      )}

      {candidate.aiReview
        ? <p className="dv-review dv-review--enter">{candidate.aiReview}</p>
        : <SkeletonLine width="90%" height={13} />}

      {(candidate.leetcode || candidate.github || candidate.hasResume) && (
        <div className="dv-proof">
          {candidate.hasResume && (
            <span className="dv-proof-item"><FileText size={12} aria-hidden="true" /> Resume on file</span>
          )}
          {candidate.leetcode && (
            <span className="dv-proof-item">
              <Code2 size={12} aria-hidden="true" />
              {candidate.leetcode.totalSolved.toLocaleString()} solved
              {candidate.leetcode.contestRating ? ` · ${candidate.leetcode.contestRating}` : ''}
            </span>
          )}
          {candidate.github && (
            <span className="dv-proof-item">
              <Github size={12} aria-hidden="true" />
              {candidate.github.publicRepoCount.toLocaleString()} repos
              {candidate.github.totalStars > 0 ? ` · ★ ${candidate.github.totalStars.toLocaleString()}` : ''}
            </span>
          )}
        </div>
      )}

      <div className="dv-card__actions">
        {candidate.addedToPipeline ? (
          <span className="dv-card__meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} aria-hidden="true" /> In pipeline
          </span>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            loading={isAdding}
            onClick={() => onAdd(candidate.seekerUserId)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13} aria-hidden="true" /> Add to pipeline
            </span>
          </Button>
        )}
      </div>
    </article>
  );
}
