// FILE: src/services/employer/discover-pool-service.js
// Stage 1 of the Discover funnel: who is even eligible to be suggested for this
// posting. A handful of indexed queries, no AI, no scoring.
//
// THE CONSENT IS COMPANY-SCOPED, AND THAT IS THE WHOLE SHAPE OF THIS FILE.
// The apply form asks: "I'm open to being contacted about future roles at
// {companyName}." That permission is given to ONE employer, about THEIR future
// roles. Using it to surface the same person to a different company would break
// both the promise on the form and the DPDP basis we recorded for it — so the
// pool is built from applications to THIS company, never from a global sweep of
// seekers. A seeker who never applied here is not eligible, by design.
//
// Consent also lives per-application rather than on the seeker, so it is read
// where it was actually given.

import { col } from '../../Db/connection.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { ObjectId } from 'mongodb';
import { normalizeSkillSet } from '../seeker/profile-match-helpers.js';

/** Enough to rank meaningfully without loading a company's whole history. */
const POOL_LIMIT = 50;

const toOid = (id) => (id instanceof ObjectId ? id : new ObjectId(String(id)));
const lower = (value) => String(value ?? '').trim().toLowerCase();

/**
 * The skills this posting is actually asking for.
 *
 * Read from parsedRequirements, which the requirement extractor fills in for
 * native postings — NOT from autoTags, which only scraped jobs carry. A posting
 * whose requirements have not been extracted yet has nothing to match on, and
 * yields an empty pool rather than a random one.
 */
export function postingSkillSet(posting) {
  const requirements = posting?.parsedRequirements;
  if (!requirements) return new Set();
  return normalizeSkillSet([
    ...(Array.isArray(requirements.required_skills) ? requirements.required_skills : []),
    ...(Array.isArray(requirements.preferred_skills) ? requirements.preferred_skills : []),
  ]);
}

/** Every skill string a seeker has, from either storage shape. */
export function seekerSkillSet(seeker) {
  const parsed = Array.isArray(seeker?.parsedProfile?.skills) ? seeker.parsedProfile.skills : [];
  return normalizeSkillSet([
    ...(Array.isArray(seeker?.skills) ? seeker.skills : []),
    // The resume parser stores objects; the profile editor stores strings.
    ...parsed.map((skill) => (typeof skill === 'string' ? skill : skill?.name)),
  ]);
}

/** Emails that consented to future roles AT THIS COMPANY, minus this posting's applicants. */
async function eligibleEmails(companyId, postingId) {
  const applications = await (await col('applications'))
    .find(
      { companyId: toOid(companyId) },
      { projection: { contactId: 1, jobId: 1, 'consent.futureOpportunitiesConsent': 1 } },
    ).toArray();

  const postingOid = toOid(postingId);
  const consentedContactIds = new Set();
  const appliedHereContactIds = new Set();
  for (const application of applications) {
    if (!application.contactId) continue;
    const key = String(application.contactId);
    if (application.consent?.futureOpportunitiesConsent === true) consentedContactIds.add(key);
    // Already on this posting — suggesting them again would duplicate the row.
    if (String(application.jobId) === String(postingOid)) appliedHereContactIds.add(key);
  }

  const candidateIds = [...consentedContactIds]
    .filter((id) => !appliedHereContactIds.has(id))
    .map((id) => new ObjectId(id));
  if (candidateIds.length === 0) return new Set();

  const contactRows = await (await col('contacts'))
    .find({ companyId: toOid(companyId), _id: { $in: candidateIds } }, { projection: { email: 1 } })
    .toArray();
  return new Set(contactRows.map((contact) => lower(contact.email)).filter(Boolean));
}

/**
 * @returns {{ posting: object, skills: Set<string>, seekers: object[] }}
 * @throws HttpError(404) when the posting is not this company's.
 */
export async function findCandidatePool(companyId, postingId) {
  const posting = await (await col('jobs')).findOne({
    _id: toOid(postingId), companyId: toOid(companyId),
  });
  if (!posting) throw new HttpError(404, 'Posting not found', 'POSTING_NOT_FOUND');

  const skills = postingSkillSet(posting);
  if (skills.size === 0) return { posting, skills, seekers: [] };

  const emails = await eligibleEmails(companyId, postingId);
  if (emails.size === 0) return { posting, skills, seekers: [] };

  // The join back to seeker accounts is by email — the only identifier the two
  // audiences share. Someone who consented but never made a JobMesh account has
  // no profile to rank, so they simply do not appear.
  const seekers = await (await col('users'))
    .find(
      { email: { $in: [...emails] } },
      {
        projection: {
          name: 1, email: 1, slug: 1, skills: 1, lastResumeHash: 1,
          leetcodeUsername: 1, githubUsername: 1,
          'parsedProfile.skills': 1, 'parsedProfile.currentLocation': 1,
          'parsedProfile.summary': 1, 'parsedProfile.totalExperienceYears': 1,
        },
      },
    )
    .limit(POOL_LIMIT)
    .toArray();

  // Only people who actually overlap the posting. Alias-aware, so "React.js" on a
  // resume still matches "reactjs" in the requirements.
  return {
    posting,
    skills,
    seekers: seekers.filter((seeker) => {
      for (const skill of seekerSkillSet(seeker)) if (skills.has(skill)) return true;
      return false;
    }),
  };
}
