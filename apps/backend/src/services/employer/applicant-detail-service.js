// FILE: src/services/employer/applicant-detail-service.js
// Composes the full applicant detail view (D2): application + contact + AI score +
// stage-change history + resume metadata + a signed download URL. Every read is
// companyId-scoped (§6.5); a cross-tenant applicationId surfaces as 404, never a
// leak. The download URL is a short-lived signed token (no auth cookie needed to
// open the PDF inline) built by the signed-url service.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getApplicationForCompany } from '../../models/public/application-model.js';
import { getContactForCompany, toPublicContact } from '../../models/public/contact-model.js';
import { getResumeScoreForApplication, toPublicResumeScore } from '../../models/public/resume-score-model.js';
import { listStageChangesForApplication } from '../../models/public/stage-change-model.js';
import { getResumeFileForApplication } from '../../models/public/resume-file-model.js';
import { getScoreJobStatusForApplication } from '../public/resume-score-queue-service.js';
import {
  getAssignmentSubmissionForCompany, toPublicAssignmentSubmission,
} from '../../models/public/assignment-submission-model.js';
import {
  getAssignmentReviewForSubmission, toPublicAssignmentReview,
} from '../../models/public/assignment-review-model.js';
import {
  listOtherApplicationsForContact, toOtherApplication,
} from '../../models/public/contact-application-model.js';
import { toEmployerApplication, toEmployerStageChange, toResumeMeta } from './applicant-mappers.js';
import { signResumeToken } from './signed-url-service.js';
import { resolveApplicantLeetCode } from './applicant-leetcode-lookup.js';
import { resolveApplicantGitHub } from './applicant-github-lookup.js';

/** Assemble every section of one applicant's detail page for the owning company. */
export async function getApplicantDetailForCompany(companyId, applicationId) {
  const application = await getApplicationForCompany(companyId, applicationId);
  if (!application) throw new HttpError(404, 'Application not found', 'APPLICATION_NOT_FOUND');

  // ONE ROUND TRIP. Every read below needs nothing but `application`, which is
  // already in hand, so queueing them cost seven sequential latencies for no
  // ordering that anything actually required.
  //
  // The two conditional reads keep their guards INSIDE the batch rather than in
  // front of it: a legacy application with no contactId or no assignment still
  // issues exactly the queries it did before, which is none.
  const [
    contact, score, stageChanges, resumeFile, scoreJobStatus,
    otherApplications, assignmentSubmission,
  ] = await Promise.all([
    getContactForCompany(companyId, application.contactId),
    getResumeScoreForApplication(application._id),
    listStageChangesForApplication(application._id),
    getResumeFileForApplication(application._id),
    // Queue lifecycle, separate axis from score.processingError — lets the UI show
    // "Rescoring…" while a job is queued/processing. null when no job doc exists.
    getScoreJobStatusForApplication(application._id),
    // The same person's other applications at this company (contacts are deduped by
    // email, so this is identity, not a guess). Omitted from the response entirely
    // when empty — the UI's signal to render nothing rather than an empty section.
    application.contactId
      ? listOtherApplicationsForContact(companyId, application.contactId, application._id)
      : [],
    // Legacy applications carry no assignmentSubmissionId, so the collection is
    // not queried at all for them — the UI renders "No assignment required".
    application.assignmentSubmissionId
      ? getAssignmentSubmissionForCompany(companyId, application.assignmentSubmissionId)
      : null,
  ]);

  // Public proof-of-work, resolved in priority order:
  //   1. the snapshot ON THIS APPLICATION — typed on the apply form, or looked up
  //      by an employer. It wins because it is specific to this application and
  //      somebody chose it deliberately;
  //   2. the live seeker connection, matched by email;
  //   3. nothing.
  //
  // The snapshot short-circuits the lookup entirely, so an application that
  // already carries data costs no cross-audience query at all.
  // Both providers resolve the same way and are independent of each other, so
  // they race rather than queue — two 5s ceilings in sequence would be a 10s
  // ceiling on a page that must not wait on anyone.
  //
  // The assignment review joins this wave rather than preceding it: it is the only
  // read that genuinely had to wait (it keys off the submission we just verified
  // belongs to this company), and it has nothing to do with the proof-of-work
  // lookups, so the two should not queue behind each other.
  const [leetcode, github, assignmentReview] = await Promise.all([
    application.leetcodeData ?? resolveApplicantLeetCode(contact?.email ?? null),
    application.githubData ?? resolveApplicantGitHub(contact?.email ?? null),
    assignmentSubmission
      ? getAssignmentReviewForSubmission(companyId, assignmentSubmission._id)
      : null,
  ]);

  const resumeMeta = resumeFile ? toResumeMeta(resumeFile) : null;
  const resumeDownloadUrl = resumeMeta
    ? `/api/public/resume-download?token=${signResumeToken(application._id)}`
    : null;

  return {
    application: toEmployerApplication(application),
    contact: contact ? toPublicContact(contact) : null,
    score: score ? toPublicResumeScore(score) : null,
    scoreJobStatus,
    stageChanges: stageChanges.map(toEmployerStageChange),
    resumeMeta,
    resumeDownloadUrl,
    // null for an external applicant with no snapshot and no connected seeker —
    // the UI reads that one falsy case and offers the manual lookup instead.
    leetcode,
    // Echoed so the employer's lookup box can show what was tried, and so a
    // cleared-then-retyped username is distinguishable from never having one.
    leetcodeUsername: application.leetcodeUsername ?? null,
    github,
    githubUsername: application.githubUsername ?? null,
    ...(otherApplications.length > 0
      ? { otherApplications: otherApplications.map(toOtherApplication) }
      : {}),
    // Two SEPARATE scoring axes. `score` above is the AI resume score (0-100 with
    // tiers); assignmentReview.overallScore is a human 1-5 verdict. They measure
    // different things on different scales — never blend or average them.
    assignmentSubmission: assignmentSubmission ? toPublicAssignmentSubmission(assignmentSubmission) : null,
    assignmentReview: assignmentReview ? toPublicAssignmentReview(assignmentReview) : null,
  };
}

export default getApplicantDetailForCompany;
