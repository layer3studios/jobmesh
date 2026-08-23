// FILE: src/services/public/apply-assignment-path.js
// The take-home half of an application: drift check, staged-file resolution, the
// atomic write, then the post-commit side effects. Split out of apply-service.js
// (section 2) -- that file was one 250-line function, and the two paths through it
// are genuinely different operations.
//
// THE BODY IS THE ORIGINAL, UNCHANGED. It reads nine values from what used to be
// its enclosing scope, so they arrive as one explicit context object instead. Every
// ordering rule the comments describe still holds and still matters:
//   - everything is computed BEFORE the transaction opens, because the callback may
//     run more than once and must write byte-identical documents;
//   - staged files are deleted only on rollback;
//   - the rename, the score enqueue and both emails happen AFTER commit only.
//
// The caller keeps the outer try/catch that deletes the stored resume on failure,
// so the cleanup semantics are exactly what they were.

import { ObjectId } from 'mongodb';
import { client } from '../../Db/connection.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { DPDP_NOTICE_VERSION } from '../../env.js';
import { getAssignmentForCompany } from '../../models/employer/assignment-model.js';
import { buildAssignmentSnapshot } from '../../models/public/index.js';
import { promoteStagedFile, deleteStagedFile } from './assignment-storage-service.js';
import { asArray, resolveStagedFiles } from './apply-submission-files.js';
import { runApplyTransaction } from './apply-transaction.js';
import {
  validateSubmissionLinks, validateGithubProfileUrl, validateLinkedinProfileUrl,
  validateSeekerNotes,
} from './assignment-submission-validators.js';
import { enqueueScoreJob } from './resume-score-queue-service.js';
import { queueLeetCodeSnapshot } from './apply-leetcode-snapshot.js';
import { queueApplicationReceivedEmail } from '../email/application-received-email-service.js';
import { queueNewApplicationNotification } from '../employer/new-application-notification-service.js';
import { incrementReferralApplicationCount } from '../../models/employer/referral-link-model.js';

/**
 * @param {object} context  form, posting, company, clean, contact, resumeRecord,
 *                          baseApplication, defaultStage, referral -- the nine
 *                          values this branch used to close over.
 * @param {(contact, posting) => void} logDoNotContactApplication
 * @returns {Promise<{ applicationId: string }>}
 */
export async function processAssignmentApplication(context, logDoNotContactApplication) {
  const {
    form, posting, company, clean, contact, resumeRecord, baseApplication, defaultStage, referral,
  } = context;

    // ── Assignment posting: everything below lands atomically or not at all. ──

    // Drift check: the client echoes the assignment the form actually rendered. If
    // the employer swapped it mid-session, the candidate answered a different task.
    if (form.assignmentId === undefined || form.assignmentId === null || form.assignmentId === '') {
      throw new HttpError(400, 'This application is missing its assignment reference.', 'MISSING_ASSIGNMENT_ID');
    }
    if (String(form.assignmentId) !== String(posting.assignmentId)) {
      throw new HttpError(
        409,
        'This assignment was updated while you were working. Refresh to see the latest version.',
        'ASSIGNMENT_CHANGED',
      );
    }

    const assignment = await getAssignmentForCompany(company._id, posting.assignmentId);
    // A posting pointing at a deleted assignment is a data bug on our side, not
    // something the candidate did wrong.
    if (!assignment) throw new HttpError(500, 'This assignment is unavailable.', 'ASSIGNMENT_MISSING');

    // Everything below is computed BEFORE the transaction opens — see the comment
    // on runApplyTransaction for why the callback may not do any of it.
    const now = new Date();
    const applicationId = new ObjectId();
    const submissionId = new ObjectId();

    const links = validateSubmissionLinks(asArray(form.assignmentLinks), now);
    const files = resolveStagedFiles(asArray(form.assignmentFileIds), now);
    if (links.length === 0 && files.length === 0) {
      throw new HttpError(
        400, 'Add at least one link or file for the assignment.', 'ASSIGNMENT_SUBMISSION_REQUIRED',
      );
    }

    const seekerNotesMarkdown = validateSeekerNotes(form.assignmentNotesMarkdown);
    const profileLinks = {
      githubUrl: validateGithubProfileUrl(form.githubUrl),
      linkedinUrl: validateLinkedinProfileUrl(form.linkedinUrl),
    };
    const snapshot = buildAssignmentSnapshot(assignment, now); // pure — no I/O

    const submissionDoc = {
      applicationId, companyId: company._id, jobId: posting._id,
      assignmentSnapshot: snapshot, profileLinks, submittedAt: now,
      links,
      // The row stores the FINAL path even though the bytes are still in staging:
      // the path is deterministic from uuid+ext, and the reconciler closes the gap
      // if we crash before the rename. Never the reverse — a committed row pointing
      // at a not-yet-moved file is recoverable; a moved file with no row is not.
      files: files.map(({ stagingPath, ...file }) => file),
      seekerNotesMarkdown,
    };

    const applicationDoc = {
      ...baseApplication,
      assignmentSubmissionId: submissionId,
      consent: {
        dpdpAcceptedAt: now,
        futureOpportunitiesConsent: clean.futureOpportunities,
        // The `consents` collection cannot be used for this flow: insertConsent
        // requires a userId and every /api/dpdp route sits behind requireSeeker,
        // but public applicants are anonymous and have no user row. This embedded
        // object is therefore the ONLY evidence store available here.
        // DPDP_NOTICE_VERSION must be bumped in the environment before this ships —
        // the notice content changed when assignment data collection was added.
        dataItems: ['assignment_files', 'assignment_notes', 'profile_links'],
        noticeVersion: DPDP_NOTICE_VERSION,
      },
    };

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await runApplyTransaction({
          session, applicationId, submissionId, companyId: company._id,
          submissionDoc, applicationDoc,
          resumeFileId: resumeRecord._id, defaultStageId: defaultStage._id,
        });
      });
    } catch (err) {
      // The transaction rolled back, so nothing references these bytes.
      for (const file of files) deleteStagedFile(file.stagingPath);
      throw err;
    } finally {
      await session.endSession();
    }

    // AFTER COMMIT ONLY. A failed rename must NOT throw: the row is committed and
    // the boot reconciler will promote the file. Losing a candidate's whole
    // application because one rename failed would be far worse than a late file.
    for (const file of files) {
      if (!promoteStagedFile(file.stagingPath)) {
        console.warn(`[assignments] could not promote ${file.stagingPath} for submission ${submissionId}`);
      }
    }

    // Post-commit only, for the same reason as the plain path — and additionally
    // because the transaction callback may run more than once, which would
    // double-count a retried attempt.
    if (referral.referralLinkId) {
      incrementReferralApplicationCount(referral.referralLinkId)
        .catch((err) => console.warn('[referral] application count failed:', err.message));
    }

    // Post-commit, unawaited — same rule as the plain path, and additionally
    // because the transaction callback may run more than once.
    queueLeetCodeSnapshot(applicationId, clean.leetcodeUsername);

    enqueueScoreJob(applicationId, company._id, posting._id)
      .catch((err) => console.warn('[score-queue] enqueue failed:', err.message));

    // After commit only — see the note on the plain path. Never inside the
    // transaction callback, which may run more than once.
    queueApplicationReceivedEmail({
      to: clean.email, firstName: clean.firstName,
      postingTitle: posting.title, companyName: company.name,
    });
    queueNewApplicationNotification({
      companyId: company._id, companyName: company.name,
      postingId: posting._id.toString(), postingTitle: posting.title,
      applicationId: applicationId.toString(),
      candidateName: `${clean.firstName} ${clean.lastName ?? ''}`.trim() || clean.email,
    });

    // Not surfaced to the candidate — see the note on the plain path.
    logDoNotContactApplication(contact, posting);
    return { applicationId: applicationId.toString() };
}
