// FILE: src/services/employer/discover-ai-review-service.js
// Stage 3 of the Discover funnel: two sentences on why one candidate might suit
// one posting, plus a coarse rating.
//
// RUN LAZILY, ONE CANDIDATE AT A TIME, from the frontend as cards come into view.
// Ten reviews up front would put ~20s in front of a tab that is otherwise instant,
// and most of them would be for candidates the employer never scrolls to.
//
// JSON OUT, NOT PROSE. The house pattern (extract-requirements, review-resume) is
// schema-in-prompt with a regex fallback, and it is used here for the same reason:
// splitting free text on its last line breaks the moment the model adds a
// preamble, and that failure is silent — it would file a STRONG candidate as
// "possible" rather than erroring.
//
// A failure here is never fatal. The card renders with its skills and badges and
// no review, which is still the useful part.

import { getEmployerAiClient } from '../../gemma/index.js';
import { EMPLOYER_SCORING_ENABLED } from '../../env.js';

export const RATINGS = ['strong', 'good', 'possible'];

const SCHEMA = '{"review":"","rating":"STRONG|GOOD|POSSIBLE"}';

const SYSTEM_PROMPT = `You are a recruiting assistant helping a hiring manager triage sourced candidates.
Return ONLY valid JSON matching this schema exactly: ${SCHEMA}.
review: EXACTLY two sentences on why this candidate could fit this specific role. Reference their actual skills and evidence. No greeting, no preamble, no bullet points.
rating: STRONG when they match most required skills with supporting evidence; GOOD when they match well but with a gap; POSSIBLE when the overlap is partial or thin.
Judge ONLY what you are given. Never invent experience, employers, or numbers not present in the profile.
Do not mention the candidate's name, gender, age, or location.`;

function parseJson(raw) {
  try { return JSON.parse(raw); } catch {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
}

/** Trim to two sentences: the prompt asks for two, but a cap is cheaper than trust. */
function normalizeReview(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text.slice(0, 400);
  // Each match keeps its trailing space, so trim per sentence before rejoining —
  // otherwise every review comes back double-spaced between sentences.
  return sentences.slice(0, 2).map((sentence) => sentence.trim()).join(' ').slice(0, 400);
}

function normalizeRating(value) {
  const rating = String(value ?? '').trim().toLowerCase();
  // Defaults DOWN, not up. An unreadable rating must never promote someone to
  // STRONG — the cost of overselling a candidate is an employer's wasted call.
  return RATINGS.includes(rating) ? rating : 'possible';
}

/** The candidate facts the prompt is allowed to see. Nothing identifying. */
export function buildSeekerSummary({ matchedSkills, allSkills, experienceYears, summary, leetcode, github }) {
  return {
    skills: (allSkills ?? []).slice(0, 25),
    matchedSkills: matchedSkills ?? [],
    experienceSummary: [
      typeof experienceYears === 'number' ? `${experienceYears} years total experience` : null,
      summary ? String(summary).slice(0, 400) : null,
    ].filter(Boolean).join('. ') || null,
    leetcodeSummary: leetcode
      ? `${leetcode.totalSolved ?? 0} problems solved (${leetcode.hardSolved ?? 0} hard)`
        + (leetcode.contestRating ? `, contest rating ${leetcode.contestRating}` : '')
      : null,
    githubSummary: github
      ? `${github.publicRepoCount ?? 0} public repos, ${github.totalStars ?? 0} stars,`
        + ` ${github.totalContributions ?? 0} contributions in the past year`
      : null,
  };
}

/**
 * @returns {{ review: string, rating: string } | null} null when AI is disabled,
 *   unreachable, or answered unusably — the caller renders the card without it.
 */
export async function generateMicroReview(summary, posting, deps = {}) {
  const { client = null, enabled = EMPLOYER_SCORING_ENABLED } = deps;
  if (!enabled) return null;

  const requirements = posting?.parsedRequirements ?? {};
  const userMessage = JSON.stringify({
    candidate: {
      skills: summary.skills,
      skillsMatchingThisRole: summary.matchedSkills,
      experience: summary.experienceSummary,
      leetcode: summary.leetcodeSummary,
      github: summary.githubSummary,
    },
    role: {
      title: posting?.title ?? 'this role',
      requiredSkills: requirements.required_skills ?? [],
      preferredSkills: requirements.preferred_skills ?? [],
    },
  });

  try {
    const ai = client ?? getEmployerAiClient();
    if (!ai) return null;
    const raw = await ai.generateContent(SYSTEM_PROMPT, userMessage, { temperature: 0.3 });
    const parsed = parseJson(raw);
    const review = normalizeReview(parsed?.review);
    if (!review) return null;
    return { review, rating: normalizeRating(parsed?.rating) };
  } catch (error) {
    console.warn(`[discover] micro-review failed: ${error.message}`);
    return null;
  }
}
