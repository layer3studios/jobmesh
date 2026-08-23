// FILE: src/services/public/apply-transaction.js
// The four writes an assignment application must land atomically, as one
// callback-friendly unit. Split out of apply-service.js (section 2).
//
// THE IDEMPOTENCY CONTRACT MOVED WITH THE CODE and is unchanged: the driver
// re-runs this callback on a TransientTransactionError, so nothing here may have a
// side effect outside the session -- no new ObjectId, no new Date, no I/O, no
// queue enqueue. Every id and timestamp is computed by the caller and passed in.

import {
  insertAssignmentSubmission, createApplicationForCompany,
  attachResumeFileToApplication, createStageChange,
} from '../../models/public/index.js';

/**
 * The four writes that must be atomic, as one callback-friendly unit.
 *
 * EXPORTED as a seam: the driver retries this callback on a
 * TransientTransactionError, and the only honest way to test rollback and retry
 * behaviour in this repo is to drive it directly. apply-service imports its model
 * helpers as static ESM bindings — module namespace objects are immutable, so they
 * cannot be monkey-patched, and there is no mocking library here (node --test
 * only). `operations` is injectable purely so a test can substitute a failing or
 * first-call-throwing implementation; production always uses the default.
 */
export const APPLY_TRANSACTION_OPERATIONS = Object.freeze({
  insertAssignmentSubmission,
  createApplicationForCompany,
  attachResumeFileToApplication,
  createStageChange,
});

/**
 * Run the four atomic writes. Called as a withTransaction callback, so:
 *
 *   THIS FUNCTION MAY RUN MORE THAN ONCE. The driver re-executes the whole callback
 *   on a TransientTransactionError, and the spec requires callbacks to be
 *   idempotent. Therefore NOTHING here may have a side effect outside the session:
 *   no file I/O, no `new ObjectId()`, no `new Date()`, no mutation of anything
 *   declared outside, no analytics, no queue enqueue, no logging. Every id, every
 *   timestamp and every derived array is computed by the caller and passed in, so a
 *   second attempt writes byte-identical documents to the same _ids rather than
 *   orphaning the first attempt's.
 *
 * Every operation takes { session } explicitly: col() binds no session, so an op
 * without one commits OUTSIDE the transaction and will never roll back, silently.
 */
export async function runApplyTransaction(context, operations = APPLY_TRANSACTION_OPERATIONS) {
  const {
    session, applicationId, submissionId, companyId, submissionDoc, applicationDoc,
    resumeFileId, defaultStageId,
  } = context;

  await operations.insertAssignmentSubmission({ ...submissionDoc, _id: submissionId }, { session });
  await operations.createApplicationForCompany(companyId, { ...applicationDoc, _id: applicationId }, { session });
  await operations.attachResumeFileToApplication(resumeFileId, applicationId, { session });
  await operations.createStageChange({
    applicationId, fromStageId: null, toStageId: defaultStageId,
    movedByUserId: null, note: 'Application received',
  }, { session });
}
