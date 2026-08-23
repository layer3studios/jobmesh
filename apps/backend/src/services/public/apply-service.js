// FILE: src/services/public/apply-service.js
// Orchestrates a public application (Lever insert pattern, SPEC §5.4): resolve
// company + active posting by slug → validate → dedup contact → store resume →
// create application + initial stage_change. companyId is always read from the
// looked-up company, never from the request (C7). Storage is injected for tests.
//
// TWO PATHS. A posting with no assignment attached runs exactly the code it always
// has: no session, no transaction, no extra query. Only a posting carrying an
// assignmentId takes the transactional path below, where the application and its
// submission must land together or not at all.

import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getCompanyBySlug } from '../../models/employer/company-model.js';
import {
  getActivePostingBySlugForCompany, getPostingBySlugForCompany,
} from '../../models/employer/posting-model.js';
import { getDefaultStageForCompany } from '../../models/employer/stage-model.js';
import {
  findOrCreateContactForCompany, createApplicationForCompany,
  createResumeFile, attachResumeFileToApplication, createStageChange,
} from '../../models/public/index.js';
import * as defaultStorage from './resume-storage-service.js';
import { processAssignmentApplication } from './apply-assignment-path.js';
import { validateApplicationForm, isHoneypotFilled } from './apply-validators.js';
import { enqueueScoreJob } from './resume-score-queue-service.js';
import { queueLeetCodeSnapshot } from './apply-leetcode-snapshot.js';

// Re-exported: apply-service stays the seam the transaction tests drive, even
// though the unit itself now lives next door.
export { APPLY_TRANSACTION_OPERATIONS, runApplyTransaction } from './apply-transaction.js';
import { queueApplicationReceivedEmail } from '../email/application-received-email-service.js';
import { queueNewApplicationNotification } from '../employer/new-application-notification-service.js';
import { logDoNotContactApplication } from './apply-do-not-contact-log.js';
import { resolveReferralAttribution } from './referral-attribution-service.js';
import { validateScreeningAnswers } from './screening-answer-validators.js';
import { incrementReferralApplicationCount } from '../../models/employer/referral-link-model.js';







/**
 * Process an application. `resume` is { buffer, originalFilename, mimeType }.
 * `meta` carries request evidence. `storage` is injectable for tests.
 */
export async function processApplication(companySlug, jobSlug, form, resume, meta = {}, storage = defaultStorage) {
  const company = await getCompanyBySlug(companySlug);
  if (!company) throw new HttpError(404, 'Company not found.', 'COMPANY_NOT_FOUND');

  const posting = await getActivePostingBySlugForCompany(company._id, jobSlug);
  if (!posting) {
    // Narrowly scoped: ONLY an assignment posting gets the softer message. A
    // candidate who spent hours on a take-home deserves to know the role closed
    // rather than be told it does not exist. Plain postings keep the 404 exactly.
    const anyStatus = await getPostingBySlugForCompany(company._id, jobSlug);
    if (anyStatus && anyStatus.assignmentId && anyStatus.status !== 'active') {
      throw new HttpError(
        409,
        'This role closed while you were working on the assignment. Your work has not been lost — copy it before leaving this page.',
        'POSTING_CLOSED_DURING_APPLY',
      );
    }
    throw new HttpError(404, 'This job is no longer accepting applications.', 'POSTING_NOT_FOUND');
  }

  // The posting is still 'active' but its deadline has passed — the nightly
  // auto-close task has not run yet, or auto-close was never enabled. Either way the
  // employer said no more applications after this date, so refuse now rather than
  // accepting one the deadline promised would not be accepted.
  //
  // 410 Gone, not 404: the posting exists and the candidate's URL was correct.
  if (posting.applicationDeadline && new Date(posting.applicationDeadline).getTime() <= Date.now()) {
    throw new HttpError(410, 'Applications for this position have closed.', 'POSTING_DEADLINE_PASSED');
  }

  // Honeypot: bots fill the hidden field. Respond OK without storing anything (R4).
  if (isHoneypotFilled(form)) return { applicationId: 'ok' };

  const clean = validateApplicationForm(form);
  if (!resume?.buffer) throw new HttpError(400, 'A resume file is required.', 'NO_FILE');

  const defaultStage = await getDefaultStageForCompany(company._id);
  if (!defaultStage) throw new HttpError(500, 'This company has no application pipeline.', 'NO_DEFAULT_STAGE');

  // Stays OUTSIDE the transaction: already idempotent, handles its own E11000 race,
  // and pulling it in would widen the write-conflict window for no benefit. A
  // rolled-back apply can therefore leave a contact with no application — harmless,
  // since contacts are shared across applications by design and a stray one is
  // invisible to the employer's application-scoped views.
  const { contact } = await findOrCreateContactForCompany(company._id, {
    email: clean.email, fullName: `${clean.firstName} ${clean.lastName}`, phone: clean.phone,
  });

  const stored = storage.storeResumeFile(resume.buffer);
  try {
    const resumeRecord = await createResumeFile({
      applicationId: null, storagePath: stored.storagePath,
      originalFilename: resume.originalFilename, mimeType: resume.mimeType, sizeBytes: stored.sizeBytes,
    });

    // Resolved BEFORE either path branches, and before the transaction opens: it is
    // a read, and the transactional callback may not perform side effects or
    // depend on anything it computes itself (see runApplyTransaction).
    const referral = await resolveReferralAttribution(
      form.referralToken, company._id, form.utm_source ?? null,
    );

    // Throws a field-level 400 when a required question is unanswered, so the
    // candidate is told which one before anything is written.
    const screeningAnswers = validateScreeningAnswers(posting.screeningQuestions, form);

    const baseApplication = {
      jobId: posting._id, contactId: contact._id, stageId: defaultStage._id,
      screeningAnswers,
      resumeFileId: resumeRecord._id, coverNote: clean.coverNote, yearsExperience: clean.yearsExperience,
      leetcodeUsername: clean.leetcodeUsername,
      source: referral.source, sourceDetail: referral.sourceDetail,
      referralLinkId: referral.referralLinkId,
      applicantIp: meta.applicantIp ?? null, userAgent: meta.userAgent ?? null, referer: meta.referer ?? null,
    };

    // ── Plain posting: the original path, unchanged. No session, no transaction. ──
    if (!posting.assignmentId) {
      const application = await createApplicationForCompany(company._id, {
        ...baseApplication,
        consent: { dpdpAcceptedAt: new Date(), futureOpportunitiesConsent: clean.futureOpportunities },
      });

      await attachResumeFileToApplication(resumeRecord._id, application._id);
      await createStageChange({
        applicationId: application._id, fromStageId: null, toStageId: defaultStage._id,
        movedByUserId: null, note: 'Application received',
      });

      // After the application is written, never before: a counter that outran a
      // failed insert would report referrals that do not exist. Fire-and-forget —
      // a missed increment costs one number on a dashboard, and taking the
      // application down to protect that number would be the wrong trade.
      // Started, never awaited: the candidate already has their confirmation, and
      // LeetCode being slow or down must not reach back into a committed apply.
      queueLeetCodeSnapshot(application._id, clean.leetcodeUsername);

      if (referral.referralLinkId) {
        incrementReferralApplicationCount(referral.referralLinkId)
          .catch((err) => console.warn('[referral] application count failed:', err.message));
      }

      // Enqueue AI scoring (Q1 D5): persistent, retried queue instead of fire-and-forget.
      // enqueueScoreJob never throws, but keep the .catch as a belt-and-braces guard so
      // an application can never fail on the scoring path (C8).
      enqueueScoreJob(application._id, application.companyId, application.jobId)
        .catch((err) => console.warn('[score-queue] enqueue failed:', err.message));

      // Fire-and-forget: the application is committed, so a failed send is logged
      // and dropped rather than surfaced to the candidate.
      queueApplicationReceivedEmail({
        to: clean.email, firstName: clean.firstName,
        postingTitle: posting.title, companyName: company.name,
      });
      // The team's side of the same event. Separately gated per teammate, and
      // separately fire-and-forget — neither send can affect the other.
      queueNewApplicationNotification({
        companyId: company._id, companyName: company.name,
        postingId: posting._id.toString(), postingTitle: posting.title,
        applicationId: application._id.toString(),
        candidateName: `${clean.firstName} ${clean.lastName ?? ''}`.trim() || clean.email,
      });

      // The application is ACCEPTED regardless of the do-not-contact flag: silently
      // rejecting someone because a recruiter once flagged them would be worse than
      // accepting and warning the employer.
      //
      // THE WARNING IS DELIBERATELY NOT IN THIS RESPONSE. This payload goes to the
      // CANDIDATE, and telling them they are flagged would leak an internal
      // judgement straight back to its subject. The employer sees it the moment the
      // application appears, because the flag lives on the contact and every
      // applicant surface already renders it — see DoNotContactBanner.
      logDoNotContactApplication(contact, posting);
      return { applicationId: application._id.toString() };
    }

    // ── Assignment posting: everything below lands atomically or not at all. ──
    // Lives in apply-assignment-path.js (section 2). The outer try/catch here
    // still owns resume cleanup on failure, unchanged.
    return processAssignmentApplication({
      form, posting, company, clean, contact, resumeRecord, baseApplication, defaultStage, referral,
    }, logDoNotContactApplication);
  } catch (err) {
    storage.deleteResumeFile(stored.storagePath); // cleanup on partial failure (D6)
    throw err;
  }
}
