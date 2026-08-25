// FILE: src/services/employer/discover-pipeline-service.js
// Turning a Discover suggestion into a real application.
//
// THIS IS THE ONE WRITE IN THE WHOLE FEATURE THAT TOUCHES A PERSON. Everything
// else ranks and describes; this creates a record at an employer and emails the
// candidate. So it re-checks eligibility from the database rather than trusting
// the cached row the button was rendered from — a suggestion computed six hours
// ago is not permission.
//
// The application is marked source: 'sourced' so it is never counted as an
// inbound applicant. Conversion rates, funnel reports and "where do our hires
// come from" all depend on that distinction being honest.

import { ObjectId } from 'mongodb';
import { col } from '../../Db/connection.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { createApplicationForCompany } from '../../models/public/application-model.js';
import { findOrCreateContactForCompany } from '../../models/public/contact-model.js';
import { getDefaultStageForCompany } from '../../models/employer/stage-model.js';
import { markAddedToPipeline } from '../../models/employer/recommendation-cache-model.js';
import { enqueueScoreJob } from '../public/resume-score-queue-service.js';
import { sendTransactionalEmail } from '../email/send-email-service.js';
import { buildSourcedCandidateEmail } from '../email/templates/sourced-candidate-template.js';
import { APPLY_URL } from '../../env.js';

const toOid = (id) => (id instanceof ObjectId ? id : new ObjectId(String(id)));

/**
 * Re-verify, at write time, that this company may contact this person about this
 * posting. Returns the consenting application, or throws.
 */
async function assertStillEligible(companyId, postingId, email) {
  const applications = await col('applications');
  const companyOid = toOid(companyId);

  const contact = await (await col('contacts')).findOne(
    { companyId: companyOid, email }, { projection: { _id: 1 } },
  );
  if (!contact) throw new HttpError(403, 'This candidate has no history with your company.', 'NOT_ELIGIBLE');

  const consented = await applications.findOne({
    companyId: companyOid, contactId: contact._id, 'consent.futureOpportunitiesConsent': true,
  });
  // Consent is the entire basis for the email that follows. If it is not on file
  // for THIS company, there is no version of this action that is allowed.
  if (!consented) {
    throw new HttpError(
      403,
      'This candidate has not agreed to hear about future roles at your company.',
      'NO_FUTURE_OPPORTUNITIES_CONSENT',
    );
  }

  const already = await applications.findOne({
    companyId: companyOid, contactId: contact._id, jobId: toOid(postingId),
  });
  if (already) throw new HttpError(409, 'This candidate is already in the pipeline.', 'ALREADY_IN_PIPELINE');

  return { contactId: contact._id, consented };
}

/** Best-effort notification. A failed send never fails the pipeline add. */
async function notify({ email, name, companyName, postingTitle, postingSlug, companySlug }) {
  try {
    const applyUrl = companySlug && postingSlug
      ? `${APPLY_URL}/${companySlug}/${postingSlug}`
      : null;
    const built = buildSourcedCandidateEmail({
      firstName: (name ?? '').trim().split(/\s+/)[0] || null,
      companyName, postingTitle, applyUrl,
    });
    const result = await sendTransactionalEmail({ ...built, to: email });
    return result?.sent === true;
  } catch (error) {
    console.warn(`[discover] notification failed for ${email}: ${error.message}`);
    return false;
  }
}

/** Every seeker field addSeekerToPipeline reads — nothing else is loaded. */
const ADD_TO_PIPELINE_PROJECTION = {
  name: 1,
  email: 1,
  leetcodeUsername: 1,
  githubUsername: 1,
  'parsedProfile.fullName': 1,
  'parsedProfile.currentLocation': 1,
  'parsedProfile.totalExperienceYears': 1,
};

/**
 * Add one suggested seeker to a posting's pipeline.
 * @throws HttpError 403 (not eligible / no consent), 404, 409 (already there).
 */
export async function addSeekerToPipeline(companyId, postingId, seekerUserId) {
  const posting = await (await col('jobs')).findOne({
    _id: toOid(postingId), companyId: toOid(companyId),
  });
  if (!posting) throw new HttpError(404, 'Posting not found', 'POSTING_NOT_FOUND');

  // Allowlisted, not the whole document. The seven fields below are every one this
  // function reads; loading the rest pulled `appliedJobs` / `dismissedJobs` — this
  // candidate's history at OTHER employers — into a request made by this one.
  const seeker = await (await col('users')).findOne(
    { _id: toOid(seekerUserId) },
    { projection: ADD_TO_PIPELINE_PROJECTION },
  );
  if (!seeker?.email) throw new HttpError(404, 'Candidate not found', 'SEEKER_NOT_FOUND');
  const email = String(seeker.email).trim().toLowerCase();

  await assertStillEligible(companyId, postingId, email);

  const stage = await getDefaultStageForCompany(companyId);
  if (!stage) throw new HttpError(409, 'Set up your pipeline stages first.', 'NO_DEFAULT_STAGE');

  const { contact } = await findOrCreateContactForCompany(companyId, {
    email,
    fullName: seeker.name ?? seeker.parsedProfile?.fullName ?? null,
    location: seeker.parsedProfile?.currentLocation ?? null,
  });

  // The snapshots are copied so the applicant detail reads identically to an
  // inbound application — same fields, same fallbacks, no special-casing.
  const [leetcodeRow, githubRow] = await Promise.all([
    (await col('leetcode_cache')).findOne({ seekerUserId: toOid(seekerUserId) }),
    (await col('github_cache')).findOne({ seekerUserId: toOid(seekerUserId) }),
  ]);

  const application = await createApplicationForCompany(companyId, {
    jobId: posting._id,
    contactId: contact._id,
    stageId: stage._id,
    source: 'sourced',
    sourceDetail: 'discover-tab',
    leetcodeUsername: seeker.leetcodeUsername ?? null,
    leetcodeData: leetcodeRow?.data ?? null,
    githubUsername: seeker.githubUsername ?? null,
    githubData: githubRow?.data ?? null,
    yearsExperience: seeker.parsedProfile?.totalExperienceYears ?? null,
    // NOT copied: dpdpAcceptedAt. That consent belongs to the application the
    // candidate actually submitted; this row was created by an employer, and
    // recording it as though they accepted a notice here would be a false record.
    consent: { futureOpportunitiesConsent: true },
  });

  // Post-commit and never awaited into the response: scoring is a background job
  // and a slow queue must not hold the button.
  enqueueScoreJob(application._id, application.companyId, application.jobId)
    .catch((error) => console.warn(`[discover] score enqueue failed: ${error.message}`));

  const company = await (await col('companies')).findOne({ _id: toOid(companyId) });
  const notified = await notify({
    email,
    name: seeker.name,
    companyName: company?.name ?? 'A company on JobMesh',
    postingTitle: posting.title,
    postingSlug: posting.slug ?? null,
    companySlug: company?.slug ?? null,
  });

  await markAddedToPipeline(companyId, postingId, seekerUserId, { notified });
  return { application, notified };
}
