// FILE: src/boot-indexes.js
// The boot sequence: connect, then make every index and upload directory exist.
// Split out of server.js (section 2).
//
// Every ensure* call is idempotent, which is what lets this run on every boot
// rather than in a migration. The order is preserved exactly as it was.

import { connectToDb, closeDb } from './Db/connection.js';
import {
  ensureUserIndexes, ensureLeetCodeUserIndexes, ensureLeetCodeCacheIndexes,
  ensureGitHubUserIndexes, ensureGitHubCacheIndexes, ensurePublicProfileIndexes,
} from './models/seeker/index.js';
import { ensureJobIndexes } from './models/shared/job-model.js';
import { ensureRecommendationCacheIndexes } from './models/employer/recommendation-cache-model.js';
import { ensureAdminUserIndexes, ensureScrapeRunIndexes } from './models/admin/index.js';
import { ensureInterviewIndexes, ensureInterviewReminderJobIndexes, ensureInterviewTimeIndexes } from './models/interview/index.js';
import { ensureUsageStatsIndexes } from './gemma/usage-stats.js';
import { ensureIndexingJobIndexes } from './models/admin/indexing-job-model.js';
import { ensureEmailEventIndexes } from './models/admin/email-event-model.js';
import { ensureBlogPostIndexes } from './models/content/blog-post-model.js';
import { ensureResumeDirectory } from './services/public/resume-storage-service.js';
import { ensureLogoDirectory } from './services/employer/logo-storage-service.js';
import { ensureAvatarDirectory } from './services/employer/avatar-storage-service.js';
import { ensureCulturePhotoDirectory } from './services/employer/culture-photo-storage-service.js';
import { ensureResumeParseJobIndexes } from './models/seeker/resume-parse-job-model.js';
import { ensureTmpDirectory } from './services/seeker/resume-tmp-storage.js';
import { ensureSeekerResumeDirectory } from './services/seeker/seeker-resume-storage.js';
import { ensureResumeScoreJobIndexes } from './models/public/resume-score-job-model.js';

import {
  ensureConsentIndexes, ensureAuditLogIndexes, ensureRightsRequestIndexes,
  ensureDataExportRequestIndexes,
} from './models/dpdp/index.js';
import {
  ensureContactIndexes, ensureApplicationIndexes, ensureStageChangeIndexes,
  ensureApplicantNoteIndexes, ensureAssignmentSubmissionIndexes,
  ensureAssignmentReviewIndexes, ensureResumeFileIndexes, ensureResumeScoreIndexes,
} from './models/public/index.js';
import {
  ensureEmployerUserIndexes, ensureEmployerAccessIndexes, ensureCompanyIndexes,
  ensureStageIndexes, ensureArchiveReasonIndexes, ensurePostingIndexes,
  ensureCompanyMemberIndexes, ensureCompanyInviteIndexes, ensureAssignmentIndexes,
  ensureSavedViewIndexes, ensureCandidateTagIndexes, ensureReferralLinkIndexes,
  ensureInterviewerAvailabilityIndexes,
} from './models/employer/index.js';

/** Connect and make every index + upload directory exist. Idempotent. */
export async function runBootSequence() {
    await connectToDb();
    await ensureUserIndexes();
  await ensureLeetCodeUserIndexes();
  await ensureLeetCodeCacheIndexes();
  await ensureGitHubUserIndexes();
  await ensureGitHubCacheIndexes();
  await ensurePublicProfileIndexes();
  await ensureRecommendationCacheIndexes();
    await ensureJobIndexes();
    await ensureEmployerUserIndexes();
    await ensureAdminUserIndexes();
    await ensureUsageStatsIndexes();
    await ensureScrapeRunIndexes();
    await ensureEmailEventIndexes();
    await ensureIndexingJobIndexes();
    await ensureBlogPostIndexes();
    await ensureEmployerAccessIndexes();
    await ensureCompanyIndexes();
    await ensureStageIndexes();
    await ensureArchiveReasonIndexes();
    await ensurePostingIndexes();
    await ensureCompanyMemberIndexes();
    await ensureCompanyInviteIndexes();
    await ensureSavedViewIndexes();
    await ensureCandidateTagIndexes();
    await ensureReferralLinkIndexes();
    await ensureInterviewerAvailabilityIndexes();
    await ensureConsentIndexes();
    await ensureAuditLogIndexes();
    await ensureRightsRequestIndexes();
    await ensureDataExportRequestIndexes();
    await ensureContactIndexes();
    await ensureApplicationIndexes();
    await ensureStageChangeIndexes();
    await ensureApplicantNoteIndexes();
    await ensureAssignmentIndexes();
    await ensureAssignmentSubmissionIndexes();
    await ensureAssignmentReviewIndexes();
    await ensureResumeFileIndexes();
    await ensureResumeScoreIndexes();
    await ensureResumeParseJobIndexes();
    await ensureInterviewIndexes();
    await ensureInterviewTimeIndexes();
    ensureResumeDirectory();
    ensureLogoDirectory();
    ensureAvatarDirectory();
    ensureCulturePhotoDirectory();
    ensureTmpDirectory();
    ensureSeekerResumeDirectory();
}
