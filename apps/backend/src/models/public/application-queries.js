// FILE: src/models/public/application-queries.js
// Read side of the applications collection: the filtered aggregation the employer
// list runs, plus the plain list/count helpers. Split out of application-model.js
// (naming conventions section 2, 'move statics into *-queries.js').
//
// Every query here is companyId-scoped, exactly as before -- the split moved code,
// it did not relax a single filter.

import { applicationsCol, toOid } from './application-collection.js';

/** Experience buckets applied at query time on application.yearsExperience.
 *  Half-open ranges [min, max); staff has no upper bound. */
export const EXPERIENCE_BUCKETS = {
  fresher: { min: 0, max: 1 },
  junior: { min: 1, max: 3 },
  mid: { min: 3, max: 6 },
  senior: { min: 6, max: 10 },
  staff: { min: 10, max: null },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Advanced filtered list for the employer applicant list. Filtering happens in
 * Mongo via an aggregation; lookups are added only when the corresponding
 * filter is active. Returns raw application docs (lookup fields stripped),
 * sorted appliedAt desc — the controller merges contacts/scores as before.
 *
 * filters: { stageId, archived, experienceBuckets[], skills[] (AND),
 *            locations[] (OR), appliedWithin ('24h'|'7d'|'30d'),
 *            hasResume, hasNotes }
 */
export async function listApplicationsForJobFiltered(companyId, jobId, filters = {}) {
  const companyOid = toOid(companyId);
  const jobOid = toOid(jobId);
  if (!companyOid || !jobOid) return [];

  const match = { companyId: companyOid, jobId: jobOid };
  if (filters.stageId) match.stageId = toOid(filters.stageId);
  if (filters.archived === null || filters.archived === false) match.archived = null;

  if (Array.isArray(filters.experienceBuckets) && filters.experienceBuckets.length > 0) {
    const or = filters.experienceBuckets
      .map((name) => EXPERIENCE_BUCKETS[name])
      .filter(Boolean)
      .map(({ min, max }) => max === null
        ? { yearsExperience: { $gte: min } }
        : { yearsExperience: { $gte: min, $lt: max } });
    if (or.length > 0) match.$or = or;
  }

  if (filters.appliedWithin) {
    const days = { '24h': 1, '7d': 7, '30d': 30 }[filters.appliedWithin];
    if (days) match.appliedAt = { $gte: new Date(Date.now() - days * 86400000) };
  }

  if (filters.hasResume) match.resumeFileId = { $ne: null };

  const pipeline = [{ $match: match }];

  // Skills: AND across selected tags, matched case-insensitively against the
  // AI score's matchedSkills + bonusSkills for this application.
  const skills = (filters.skills ?? []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  if (skills.length > 0) {
    pipeline.push(
      { $lookup: { from: 'resume_scores', localField: '_id', foreignField: 'applicationId', as: 'scoreDoc' } },
      { $addFields: {
        skillPool: { $map: {
          input: { $concatArrays: [
            { $ifNull: [{ $first: '$scoreDoc.matchedSkills' }, []] },
            { $ifNull: [{ $first: '$scoreDoc.bonusSkills' }, []] },
          ] },
          as: 'skill',
          in: { $toLower: '$$skill' },
        } },
      } },
      { $match: { $expr: { $setIsSubset: [skills, '$skillPool'] } } },
    );
  }

  // Locations: OR across cities, matched against the contact's free-text location.
  const locations = (filters.locations ?? []).map((c) => String(c).trim()).filter(Boolean);
  if (locations.length > 0) {
    pipeline.push(
      { $lookup: { from: 'contacts', localField: 'contactId', foreignField: '_id', as: 'contactDoc' } },
      { $match: { $or: locations.map((city) => ({
        'contactDoc.location': { $regex: `\\b${escapeRegex(city)}\\b`, $options: 'i' },
      })) } },
    );
  }

  if (filters.hasNotes) {
    pipeline.push(
      { $lookup: { from: 'applicant_notes', localField: '_id', foreignField: 'applicationId', as: 'noteDoc' } },
      { $match: { 'noteDoc.0': { $exists: true } } },
    );
  }

  pipeline.push(
    { $sort: { appliedAt: -1 } },
    { $project: { scoreDoc: 0, skillPool: 0, contactDoc: 0, noteDoc: 0 } },
  );

  const collection = await applicationsCol();
  return collection.aggregate(pipeline).toArray();
}

/** List a job's applications for a company, with optional stage/archived filters. */
export async function listApplicationsForJob(companyId, jobId, { stageId, archived } = {}) {
  const companyOid = toOid(companyId);
  const jobOid = toOid(jobId);
  if (!companyOid || !jobOid) return [];
  const query = { companyId: companyOid, jobId: jobOid };
  if (stageId) query.stageId = toOid(stageId);
  if (archived === null || archived === false) query.archived = null;
  const collection = await applicationsCol();
  return collection.find(query).sort({ appliedAt: -1 }).toArray();
}

/** Count applications for a job within a company. */
export async function countApplicationsForJob(companyId, jobId) {
  const companyOid = toOid(companyId);
  const jobOid = toOid(jobId);
  if (!companyOid || !jobOid) return 0;
  const collection = await applicationsCol();
  return collection.countDocuments({ companyId: companyOid, jobId: jobOid });
}

/**
 * Count non-archived applications for many jobs in ONE aggregation, keyed by job
 * id string. Used by the postings list, which would otherwise fire a countDocuments
 * per row (N+1). Jobs with no applications are simply absent from the map — callers
 * default to 0 rather than this padding every id.
 *
 * Archived applications are excluded: the list is answering "how many people are
 * waiting on me", and an archived candidate is not.
 */
export async function countApplicationsForJobs(companyId, jobIds) {
  const companyOid = toOid(companyId);
  const jobOids = (jobIds ?? []).map(toOid).filter(Boolean);
  if (!companyOid || jobOids.length === 0) return new Map();
  const collection = await applicationsCol();
  const rows = await collection.aggregate([
    { $match: { companyId: companyOid, jobId: { $in: jobOids }, archived: null } },
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]).toArray();
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

/** Every application by one contact within the company, newest first. */
export async function listApplicationsForContact(companyId, contactId) {
  const companyOid = toOid(companyId);
  const contactOid = toOid(contactId);
  if (!companyOid || !contactOid) return [];
  const collection = await applicationsCol();
  return collection
    .find({ companyId: companyOid, contactId: contactOid })
    .sort({ appliedAt: -1 })
    .toArray();
}
