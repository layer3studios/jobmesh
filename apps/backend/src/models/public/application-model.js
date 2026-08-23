// FILE: src/models/public/application-model.js
// applications collection — one application per (job, contact). Every query is
// companyId-scoped (§6.5). Consent timestamps + request metadata are stored for
// DPDP evidence (R5). Stage lives here; the move history is in stage_changes.

import { applicationsCol, toOid } from './application-collection.js';

// Re-exported so every existing `from './application-model.js'` import keeps
// resolving -- this split is structural and must not move anyone's import path.
export {
  EXPERIENCE_BUCKETS, listApplicationsForJobFiltered, listApplicationsForJob,
  countApplicationsForJob, countApplicationsForJobs, listApplicationsForContact,
} from './application-queries.js';

/** Idempotent index setup. Called on boot. */
export async function ensureApplicationIndexes() {
  const collection = await applicationsCol();
  await collection.createIndex({ companyId: 1, jobId: 1 }, { name: 'applications_companyId_jobId' });
  await collection.createIndex({ contactId: 1 }, { name: 'applications_contactId' });
  await collection.createIndex({ stageId: 1 }, { name: 'applications_stageId' });
  await collection.createIndex({ companyId: 1, jobId: 1, appliedAt: -1 }, { name: 'applications_companyId_jobId_appliedAt' });
  // Reverse lookup from a submission back to its application. Partial on the $type
  // so the explicit nulls most applications carry are never indexed (never sparse:
  // sparse skips MISSING fields, not explicit nulls).
  await collection.createIndex(
    { assignmentSubmissionId: 1 },
    {
      partialFilterExpression: { assignmentSubmissionId: { $type: 'objectId' } },
      name: 'applications_assignmentSubmissionId',
    },
  );
}




/**
 * Insert an application for a company. Stamps appliedAt + timestamps.
 *
 * Takes an optional { session } so the apply transaction can enrol this write, and
 * honours a caller-supplied data._id. The explicit _id exists because an assignment
 * application and its submission reference each other: both ids are generated
 * before the transaction opens, which resolves the circular reference AND makes a
 * retried callback write the same documents instead of orphaning the first attempt.
 * Existing callers pass neither and behave exactly as before.
 */
export async function createApplicationForCompany(companyId, data, { session } = {}) {
  const companyOid = toOid(companyId);
  if (!companyOid) throw new Error('createApplicationForCompany: invalid companyId');
  const collection = await applicationsCol();
  const now = new Date();
  const doc = {
    ...(data._id ? { _id: toOid(data._id) } : {}),
    companyId: companyOid,
    jobId: toOid(data.jobId),
    contactId: toOid(data.contactId),
    stageId: toOid(data.stageId),
    archived: null,
    source: data.source ?? 'apply_page',
    sourceDetail: data.sourceDetail ?? null,
    // Set only when the candidate arrived through a teammate's referral link, and
    // kept even if that link is later deactivated — attribution is a historical
    // fact about this application, not a live pointer.
    referralLinkId: toOid(data.referralLinkId),
    // Snapshot of what this candidate was asked and what they said. The question
    // TEXT is stored per answer, so editing the posting later never rewrites the
    // history of an application that was already submitted.
    screeningAnswers: Array.isArray(data.screeningAnswers) ? data.screeningAnswers : [],
    resumeFileId: toOid(data.resumeFileId),
    assignmentSubmissionId: toOid(data.assignmentSubmissionId),
    coverNote: data.coverNote ?? null,
    yearsExperience: data.yearsExperience ?? null,
    // Recruiter-applied labels, drawn from the company's candidate_tags library.
    // Names rather than ids: a tag is the word a recruiter reads, and the library
    // keeps those words canonical (see candidate-tag-model).
    tags: Array.isArray(data.tags) ? data.tags : [],
    appliedAt: now,
    lastStageMovedAt: now,
    consent: {
      dpdpAcceptedAt: data.consent?.dpdpAcceptedAt ?? null,
      futureOpportunitiesConsent: Boolean(data.consent?.futureOpportunitiesConsent),
      // DPDP evidence for flows that collect more than the base application (the
      // assignment path records files, notes and profile links). Added only when
      // supplied, so a plain apply keeps the exact consent shape it always had —
      // this projection is an allowlist, and anything not named here is dropped.
      ...(data.consent?.dataItems ? { dataItems: data.consent.dataItems } : {}),
      ...(data.consent?.noticeVersion ? { noticeVersion: data.consent.noticeVersion } : {}),
    },
    applicantIp: data.applicantIp ?? null,
    userAgent: data.userAgent ?? null,
    referer: data.referer ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc, { session });
  return { ...doc, _id: result.insertedId };
}

/** Fetch one application, scoped to the company. Cross-tenant returns null. */
export async function getApplicationForCompany(companyId, appId) {
  const companyOid = toOid(companyId);
  const appOid = toOid(appId);
  if (!companyOid || !appOid) return null;
  const collection = await applicationsCol();
  return collection.findOne({ _id: appOid, companyId: companyOid });
}




/**
 * DPDP erasure: drop the candidate-authored and request-derived fields, keep the row.
 *
 * The application itself is aggregate-reporting data (which posting, which stage,
 * when) and survives. The cover note is the candidate's own words, and IP/user-agent/
 * referer are personal data collected as consent evidence — all four go.
 */
export async function redactApplicationForCompany(companyId, applicationId) {
  const companyOid = toOid(companyId);
  const appOid = toOid(applicationId);
  if (!companyOid || !appOid) return null;
  const collection = await applicationsCol();
  return collection.findOneAndUpdate(
    { _id: appOid, companyId: companyOid },
    { $set: {
      coverNote: null, applicantIp: null, userAgent: null, referer: null,
      updatedAt: new Date(),
    } },
    { returnDocument: 'after' },
  );
}


/** Client-safe projection — ids as strings. */
export function toPublicApplication(doc) {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId?.toString() ?? null,
    contactId: doc.contactId?.toString() ?? null,
    stageId: doc.stageId?.toString() ?? null,
    source: doc.source,
    sourceDetail: doc.sourceDetail ?? null,
    referralLinkId: doc.referralLinkId?.toString() ?? null,
    coverNote: doc.coverNote ?? null,
    // The BOOLEAN only, never the answers: this projection feeds the ranked list,
    // where one row per candidate is drawn and the full Q&A would bloat the
    // payload for data the row cannot show anyway. Employer-only — the sole
    // consumer is employer-applicants-controller (verified), and a flag is our
    // judgement about a candidate, never something they should read about
    // themselves.
    hasKnockoutAnswers: (doc.screeningAnswers ?? []).some((answer) => answer.isKnockout === true),
    yearsExperience: doc.yearsExperience ?? null,
    tags: doc.tags ?? [],
    appliedAt: doc.appliedAt,
  };
}

/**
 * Replace an application's tag list. Scoped to the company (§6.5) — the names are
 * already validated against the company's library by the caller. Returns the
 * updated doc, or null when the application is missing or belongs to another tenant.
 */
export async function setApplicationTags(companyId, applicationId, tags) {
  const companyOid = toOid(companyId);
  const appOid = toOid(applicationId);
  if (!companyOid || !appOid) return null;
  const collection = await applicationsCol();
  return collection.findOneAndUpdate(
    { _id: appOid, companyId: companyOid },
    { $set: { tags, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
}
