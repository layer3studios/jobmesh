// FILE: src/services/employer/discover-service.js
// The Discover read path: serve the cached ranking, or recompute stages 1 and 2
// and cache that. Stage 3 is NOT run here — see discover-ai-review-service.
//
// STAGES 1 AND 2 ARE CHEAP ENOUGH TO REDO; stage 3 is not. That asymmetry is why
// the cache exists and why a recompute preserves AI reviews rather than blanking
// them (see replaceRecommendations).

import { col } from '../../Db/connection.js';
import { ObjectId } from 'mongodb';
import { findCandidatePool, seekerSkillSet } from './discover-pool-service.js';
import { scoreCandidate, rankCandidates } from './discover-score-service.js';
import {
  listRecommendations, replaceRecommendations, isFresh, RECOMMENDATION_LIMIT,
} from '../../models/employer/recommendation-cache-model.js';

const toOid = (id) => (id instanceof ObjectId ? id : new ObjectId(String(id)));

/** Both proof-of-work caches for a set of seekers, in two queries rather than 2N. */
async function proofOfWorkFor(seekerIds) {
  if (seekerIds.length === 0) return { leetcode: new Map(), github: new Map() };
  const ids = seekerIds.map(toOid);
  const [leetcodeRows, githubRows] = await Promise.all([
    (await col('leetcode_cache')).find({ seekerUserId: { $in: ids } }).toArray(),
    (await col('github_cache')).find({ seekerUserId: { $in: ids } }).toArray(),
  ]);
  const byId = (rows) => new Map(rows.map((row) => [String(row.seekerUserId), row.data ?? null]));
  return { leetcode: byId(leetcodeRows), github: byId(githubRows) };
}

/** Run stages 1 and 2 and write the result to the cache. Returns the cached rows. */
export async function refreshRecommendations(companyId, postingId) {
  const { posting, skills, seekers } = await findCandidatePool(companyId, postingId);
  if (seekers.length === 0) {
    await replaceRecommendations(companyId, postingId, []);
    return { posting, rows: [] };
  }

  const proof = await proofOfWorkFor(seekers.map((seeker) => seeker._id));
  const scored = seekers.map((seeker) => scoreCandidate(
    seeker, skills,
    proof.leetcode.get(String(seeker._id)) ?? null,
    proof.github.get(String(seeker._id)) ?? null,
  ));

  const rows = await replaceRecommendations(
    companyId, postingId, rankCandidates(scored, RECOMMENDATION_LIMIT),
  );
  return { posting, rows };
}

/** Cached when fresh, recomputed otherwise. */
export async function getRecommendations(companyId, postingId, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await listRecommendations(companyId, postingId);
    if (isFresh(cached)) return cached;
  }
  const { rows } = await refreshRecommendations(companyId, postingId);
  return rows;
}

/**
 * Attach the seeker details the card renders. Read at serve time rather than
 * copied into the cache: a name or a skill list that went stale inside a 6-hour
 * window would be a worse bug than the extra query.
 */
export async function hydrateRecommendations(rows) {
  if (rows.length === 0) return [];
  const seekers = await (await col('users'))
    .find(
      { _id: { $in: rows.map((row) => toOid(row.seekerUserId)) } },
      {
        projection: {
          name: 1, email: 1, skills: 1, lastResumeHash: 1,
          'parsedProfile.skills': 1, 'parsedProfile.currentLocation': 1,
          'parsedProfile.summary': 1, 'parsedProfile.totalExperienceYears': 1,
        },
      },
    ).toArray();
  const byId = new Map(seekers.map((seeker) => [String(seeker._id), seeker]));

  const proof = await proofOfWorkFor(rows.map((row) => row.seekerUserId));

  return rows.map((row) => {
    const key = String(row.seekerUserId);
    const seeker = byId.get(key);
    const leetcode = proof.leetcode.get(key) ?? null;
    const github = proof.github.get(key) ?? null;
    return {
      seekerUserId: key,
      name: seeker?.name ?? null,
      email: seeker?.email ?? null,
      location: seeker?.parsedProfile?.currentLocation ?? null,
      experienceYears: seeker?.parsedProfile?.totalExperienceYears ?? null,
      matchedSkills: row.matchedSkills ?? [],
      matchedSkillCount: row.matchedSkillCount ?? 0,
      // The raw score stays SERVER-SIDE. What ranks the list is not what should be
      // shown about a person; the matched skills below are the checkable version.
      hasResume: Boolean(row.hasResume),
      leetcode: leetcode
        ? { totalSolved: leetcode.totalSolved ?? 0, contestRating: leetcode.contestRating ?? null }
        : null,
      github: github
        ? { publicRepoCount: github.publicRepoCount ?? 0, totalStars: github.totalStars ?? 0 }
        : null,
      aiReview: row.aiReview ?? null,
      aiRating: row.aiRating ?? null,
      addedToPipeline: Boolean(row.addedToPipeline),
    };
  });
}

/** The facts stage 3's prompt is given, for one cached row. */
export async function reviewInputFor(companyId, postingId, seekerUserId) {
  const seeker = await (await col('users')).findOne({ _id: toOid(seekerUserId) });
  if (!seeker) return null;
  const proof = await proofOfWorkFor([seekerUserId]);
  const key = String(toOid(seekerUserId));
  return {
    seeker,
    allSkills: [...seekerSkillSet(seeker)],
    leetcode: proof.leetcode.get(key) ?? null,
    github: proof.github.get(key) ?? null,
  };
}
