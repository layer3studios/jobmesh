// FILE: src/services/employer/discover-score-service.js
// Stage 2 of the Discover funnel: rank the eligible pool in memory and keep the
// best few. No DB round trips, no AI — this exists so stage 3 buys ten AI calls
// instead of fifty.
//
// THE SCORE IS A SORT KEY, NOT A VERDICT, and is never shown to the employer as a
// number. What they see is the evidence behind it — matched skills, the proof-of-
// work badges — because "82" invites false precision about a person, while
// "matched 6 of 9 required skills" is a fact they can check.
//
// Skill overlap dominates every bonus combined: a candidate with the right skills
// and no side projects must outrank a candidate with neither.

import { seekerSkillSet } from './discover-pool-service.js';

// ONE MATCHED SKILL OUTWEIGHS EVERY BONUS COMBINED, and this number is what makes
// that true rather than aspirational. The badges below total at most 65
// (35 LeetCode + 25 GitHub + 5 resume), so at 100 a candidate can never place
// above someone with one more matching skill — while the badges keep their full
// range for separating candidates who match equally well.
//
// It was 10 in the first draft, which inverted the ranking: a candidate matching
// 1 of 4 required skills scored 75 against 40 for one matching all four.
const POINTS_PER_SKILL = 100;
/** The most the proof-of-work bonuses can add. Asserted in the tests. */
export const MAX_PROOF_BONUS = 65;

// Proof-of-work is a TIE-BREAKER, so every bonus here is capped well below what a
// single extra matched skill is worth. Someone cannot GitHub their way past a
// better-matched candidate.
const CONNECTED_ACCOUNT_BONUS = 5;
const LEETCODE_HARD_CAP = 20;
const CONTEST_STRONG = 1800;
const CONTEST_DECENT = 1500;
const GITHUB_CONTRIBUTION_CAP = 10;
const GITHUB_STARS_CAP = 10;
const RESUME_BONUS = 5;

const capped = (value, cap) => Math.min(Math.max(value, 0), cap);

function leetcodeScore(leetcode) {
  if (!leetcode) return 0;
  let score = CONNECTED_ACCOUNT_BONUS;
  score += capped((leetcode.hardSolved ?? 0) * 2, LEETCODE_HARD_CAP);
  const rating = leetcode.contestRating ?? 0;
  if (rating > CONTEST_STRONG) score += 10;
  else if (rating > CONTEST_DECENT) score += 5;
  return score;
}

function githubScore(github) {
  if (!github) return 0;
  let score = CONNECTED_ACCOUNT_BONUS;
  score += capped(Math.floor((github.totalContributions ?? 0) * 0.01), GITHUB_CONTRIBUTION_CAP);
  score += capped(github.totalStars ?? 0, GITHUB_STARS_CAP);
  return score;
}

/**
 * Score one seeker against one posting's skill set.
 *
 * @param {Set<string>} postingSkills canonical skills, from postingSkillSet
 * @returns the cache row shape, minus the AI fields stage 3 fills in.
 */
export function scoreCandidate(seeker, postingSkills, leetcode, github) {
  // Reported in the seeker's own words rather than canonical form: an employer
  // reading "reactjs" when the resume says "React.js" looks like a bug.
  const matchedSkills = [];
  const seen = new Set();
  const rawSkills = [
    ...(Array.isArray(seeker.skills) ? seeker.skills : []),
    ...(Array.isArray(seeker.parsedProfile?.skills) ? seeker.parsedProfile.skills : [])
      .map((skill) => (typeof skill === 'string' ? skill : skill?.name)),
  ];
  const canonical = seekerSkillSet(seeker);
  for (const raw of rawSkills) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const key = raw.trim().toLowerCase();
    if (seen.has(key)) continue;
    for (const skill of seekerSkillSet({ skills: [raw] })) {
      if (postingSkills.has(skill)) { matchedSkills.push(raw.trim()); seen.add(key); break; }
    }
  }
  // Count canonical overlaps, not raw strings: "React" and "react.js" on the same
  // resume are one skill, and paying twice for them would distort the ranking.
  let matchedSkillCount = 0;
  for (const skill of canonical) if (postingSkills.has(skill)) matchedSkillCount += 1;

  const hasResume = Boolean(seeker.lastResumeHash);
  const totalScore = matchedSkillCount * POINTS_PER_SKILL
    + leetcodeScore(leetcode)
    + githubScore(github)
    + (hasResume ? RESUME_BONUS : 0);

  return {
    seekerUserId: seeker._id,
    totalScore,
    matchedSkills,
    matchedSkillCount,
    hasLeetCode: Boolean(leetcode),
    hasGitHub: Boolean(github),
    hasResume,
  };
}

/** Rank the whole pool and keep the top `limit`. Ties break on more skills matched. */
export function rankCandidates(scored, limit) {
  return [...scored]
    .sort((a, b) => (b.totalScore - a.totalScore) || (b.matchedSkillCount - a.matchedSkillCount))
    .slice(0, limit);
}
