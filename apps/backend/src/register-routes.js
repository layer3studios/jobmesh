// FILE: src/register-routes.js
// Every route mount, in one place. Split out of server.js (naming conventions
// section 2), which had grown to hold the wiring, the boot sequence and the
// shutdown handler at once.
//
// ORDER IS LOAD-BEARING and is preserved exactly. Several mounts sit where they do
// for a reason the comments below spell out: health before any auth middleware,
// the invite-accept router before the company-scoped team router, and every
// specific /api/public/* route before the apply catch-all.

import express from 'express';
import cookieParser from 'cookie-parser';
import employerInterviewTimesRouter from './api/employer/employer-interview-times-routes.js';
import authRouter from './api/seeker/seeker-auth-routes.js';
import meRouter from './api/seeker/seeker-me-routes.js';
import seekerLeetCodeRouter from './api/seeker/seeker-leetcode-routes.js';
import seekerGitHubRouter from './api/seeker/seeker-github-routes.js';
import seekerPublicProfileRouter from './api/seeker/seeker-public-profile-routes.js';
import { jobsApiRouter } from './api/seeker/seeker-jobs-routes.js';
import usersRouter from './api/seeker/seeker-users-routes.js';
import adminRouter from './api/admin/admin-routes.js';
import { createAdminAuthRouter } from './api/admin/admin-auth-routes.js';
import { createAdminAnalyticsRouter } from './api/admin/admin-analytics-routes.js';
import adminTeamRouter from './api/admin/admin-team-routes.js';
import { createAdminAiUsageRouter } from './api/admin/admin-ai-usage-routes.js';
import { createScraperHealthRouter } from './api/admin/scraper-health-routes.js';
import { createQueueMonitorRouter } from './api/admin/queue-monitor-routes.js';
import { createAuditLogRouter } from './api/admin/audit-log-routes.js';
import { createFeatureFlagsRouter } from './api/admin/feature-flags-routes.js';
import { createJobBrowserRouter } from './api/admin/job-browser-routes.js';
import { createEmailLogRouter } from './api/admin/email-log-routes.js';
import { createAlertSettingsRouter } from './api/admin/alert-settings-routes.js';
import { createResendWebhookRouter } from './api/public/resend-webhook-route.js';
import { createSeoRouter } from './api/admin/seo-routes.js';
import { createCompanyHealthRouter } from './api/admin/company-health-routes.js';
import { createMissionControlRouter } from './api/admin/mission-control-routes.js';
import newsRouter from './api/seeker/news-routes.js';
import { createEmployerAuthRouter } from './api/employer/employer-auth-routes.js';
import employerCompanyRouter from './api/employer/employer-company-routes.js';
import employerCulturePhotoRouter from './api/employer/employer-culture-photo-routes.js';
import employerPostingsRouter from './api/employer/employer-postings-routes.js';
import employerDiscoverRouter from './api/employer/employer-discover-routes.js';
import employerAssignmentsRouter from './api/employer/employer-assignments-routes.js';
import employerAssignmentReviewsRouter from './api/employer/employer-assignment-reviews-routes.js';
import employerMeRouter from './api/employer/employer-me-routes.js';
import employerAvailabilityRouter from './api/employer/employer-availability-routes.js';
import employerContactRouter from './api/employer/employer-contact-routes.js';
import employerApplicantRouter from './api/employer/employer-applicant-routes.js';
import employerCandidateExportRouter from './api/employer/employer-candidate-export-routes.js';
import employerSavedViewsRouter from './api/employer/employer-saved-views-routes.js';
import employerStagesRouter from './api/employer/employer-stages-routes.js';
import employerArchiveReasonsRouter from './api/employer/employer-archive-reasons-routes.js';
import employerTeamRouter, { acceptRouter as employerInviteAcceptRouter } from './api/employer/employer-team-routes.js';
import employerInterviewRouter from './api/employer/employer-interview-routes.js';
import employerDashboardRouter from './api/employer/employer-dashboard-routes.js';
import employerTagRouter from './api/employer/employer-tag-routes.js';
import employerActivityRouter from './api/employer/employer-activity-routes.js';
import employerReferralRouter from './api/employer/employer-referral-routes.js';
import employerExportRouter from './api/employer/employer-export-routes.js';
import employerImportRouter from './api/employer/employer-import-routes.js';
import publicInterviewRouter from './api/public/public-interview-routes.js';
import publicInviteRouter from './api/public/public-invite-routes.js';
import publicDpdpExportRouter from './api/public/public-dpdp-export-routes.js';
import employerAvatarRouter from './api/public/employer-avatar-route.js';
import seekerAvatarRouter from './api/public/seeker-avatar-route.js';
import resumeDownloadRouter from './api/public/resume-download-route.js';
import companyLogoRouter from './api/public/company-logo-route.js';
import culturePhotoRouter from './api/public/culture-photo-route.js';
import assignmentStagingRouter from './api/public/assignment-staging-routes.js';
import assignmentDownloadRouter from './api/public/assignment-download-route.js';
import healthRouter from './api/health-routes.js';
import healthDetailedRouter from './api/health-detailed-routes.js';
import dpdpRouter from './api/dpdp/dpdp-routes.js';
import seekerResumeRouter from './api/seeker/seeker-resume-routes.js';
import seekerProfileRouter from './api/seeker/seeker-profile-routes.js';
import seekerMarketRouter from './api/seeker/seeker-market-routes.js';
import publicApplyRouter from './api/public/public-apply-routes.js';
import publicProfileRouter from './api/public/public-profile-routes.js';
import { requireSeeker } from './middleware/require-seeker-middleware.js';
import { requireAdmin } from './middleware/require-admin-middleware.js';
import { requireConsentForPurpose } from './middleware/require-consent-middleware.js';
import { requireEmployer } from './middleware/require-employer-middleware.js';
import { requireEmployerCompany } from './middleware/require-employer-company-middleware.js';
import { notFound, errorHandler } from './middleware/error-handler-middleware.js';
import { corsMiddleware } from './middleware/cors-middleware.js';

/** Mount the whole API onto an Express app. Called once, from server.js. */
export function registerRoutes(app) {
  // ─── Middleware ───────────────────────────────────────────────────
  app.use(corsMiddleware);
  // Svix signs the EXACT request bytes, so this one path takes the raw buffer.
  // It MUST precede the global express.json below: once json() has parsed the
  // body, the original bytes are unrecoverable and no signature can verify.
  app.use('/api/public/webhooks/resend', express.raw({ type: '*/*', limit: '1mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // ─── Health ───────────────────────────────────────────────────────
  // Mounted ahead of every auth middleware: monitoring and health.jobmesh.in must
  // reach /api/health with no credentials, and it must answer even when Mongo is
  // down. /api/health/detailed carries its own requireAdmin guard.
  app.get('/', (_req, res) => res.send('Job Scraper Backend running.'));
  app.use('/api/health', healthDetailedRouter);
  app.use('/api/health', healthRouter);

  // ─── Routes ───────────────────────────────────────────────────────
  app.use('/api/seeker/auth', authRouter);
  app.use('/api/seeker/me', requireSeeker, seekerLeetCodeRouter);
  app.use('/api/seeker/me', requireSeeker, seekerGitHubRouter);
  // Before meRouter: both declare paths under /api/seeker/me, and the specific
  // /profile-settings routes must not be shadowed by anything generic there.
  app.use('/api/seeker/me', requireSeeker, seekerPublicProfileRouter);
  app.use('/api/seeker/me', requireSeeker, meRouter);
  app.use('/api/seeker/jobs', jobsApiRouter);
  app.use('/api/seeker/users', usersRouter); // legacy 410 wildcard
  // Admin auth (jm_admin_token). MUST mount before /api/admin so /api/admin/auth/*
  // is not gated by requireAdmin (a user with no admin session must be able to log in).
  app.use('/api/admin/auth', createAdminAuthRouter());
  app.use('/api/admin/team', requireAdmin, adminTeamRouter);
  // AI spend dashboard. Mounted before /api/admin so the generic admin router
  // never shadows it.
  app.use('/api/admin/ai-usage', requireAdmin, createAdminAiUsageRouter());
  // Scraper health. Same reason as ai-usage: mounted before the generic admin
  // router so it is never shadowed.
  app.use('/api/admin/scraper-health', requireAdmin, createScraperHealthRouter());
  // Queue monitor. Same reason as ai-usage: mounted before the generic admin
  // router so it is never shadowed.
  app.use('/api/admin/queues', requireAdmin, createQueueMonitorRouter());
  // Company health + mission control. Same reason as ai-usage: mounted before
  // the generic admin router so neither is ever shadowed.
  app.use('/api/admin/companies-health', requireAdmin, createCompanyHealthRouter());
  app.use('/api/admin/overview', requireAdmin, createMissionControlRouter());
  app.use('/api/admin/audit-log', requireAdmin, createAuditLogRouter());
  app.use('/api/admin/feature-flags', requireAdmin, createFeatureFlagsRouter());
  app.use('/api/admin/jobs', requireAdmin, createJobBrowserRouter());
  app.use('/api/admin/email-log', requireAdmin, createEmailLogRouter());
  app.use('/api/admin/alerts', requireAdmin, createAlertSettingsRouter());
  app.use('/api/admin/seo', requireAdmin, createSeoRouter());
  app.use('/api/public/webhooks/resend', createResendWebhookRouter());
  app.use('/api/admin', adminRouter);
  // Admin analytics: jm_admin_token via new require-admin-middleware (D5 — standalone,
  // no seeker chain). Kept mounted separately (not under adminRouter) to preserve
  // master's route file boundary.
  app.use('/api/admin/analytics', requireAdmin, createAdminAnalyticsRouter());
  app.use('/api/seeker/news', newsRouter);
  app.use('/api/seeker/resume', requireSeeker, requireConsentForPurpose('resume_parsing'), seekerResumeRouter);
  app.use('/api/seeker/profile', requireSeeker, seekerProfileRouter);
  app.use('/api/seeker/market', requireSeeker, seekerMarketRouter);
  app.use('/api/employer/auth', createEmployerAuthRouter());
  app.use('/api/employer/company', requireEmployer, employerCulturePhotoRouter);
  app.use('/api/employer/company', requireEmployer, employerCompanyRouter);
  app.use('/api/employer/jobs', requireEmployer, requireEmployerCompany, employerPostingsRouter);
  // Its own base path, matching the Discover spec's URLs. Postings are served at
  // /jobs for historical reasons; this feature is new and reads better as what it
  // acts on.
  app.use('/api/employer/postings', requireEmployer, requireEmployerCompany, employerDiscoverRouter);
  app.use('/api/employer/jobs', requireEmployer, requireEmployerCompany, employerSavedViewsRouter);
  app.use('/api/employer/jobs', requireEmployer, requireEmployerCompany, employerExportRouter);
  app.use('/api/employer/jobs', requireEmployer, requireEmployerCompany, employerImportRouter);
  app.use('/api/employer/assignments', requireEmployer, requireEmployerCompany, employerAssignmentsRouter);
  app.use('/api/employer/assignment-reviews', requireEmployer, requireEmployerCompany, employerAssignmentReviewsRouter);
  // Export mounts BEFORE the main applicant router only for tidiness — the paths do
  // not overlap (/:applicationId/export exists on neither the other router nor a
  // static path it could shadow).
  // Personal settings. requireEmployer ONLY: these are the user's own fields, and a
  // teammate who has not finished onboarding still has a timezone.
  app.use('/api/employer/me', requireEmployer, employerAvailabilityRouter);
  app.use('/api/employer/me', requireEmployer, employerMeRouter);
  app.use('/api/employer/contacts', requireEmployer, requireEmployerCompany, employerContactRouter);
  app.use('/api/employer/applicants', requireEmployer, requireEmployerCompany, employerCandidateExportRouter);
  app.use('/api/employer/applicants', requireEmployer, requireEmployerCompany, employerApplicantRouter);
  app.use('/api/employer/stages', requireEmployer, requireEmployerCompany, employerStagesRouter);
  app.use('/api/employer/archive-reasons', requireEmployer, requireEmployerCompany, employerArchiveReasonsRouter);
  // Accept mounts BEFORE the company-scoped team router: the invitee may have no
  // company yet, so it uses requireEmployer only — NOT requireEmployerCompany (D2/R6).
  app.use('/api/employer/team/invites/accept', requireEmployer, employerInviteAcceptRouter);
  app.use('/api/employer/team', requireEmployer, requireEmployerCompany, employerTeamRouter);
  app.use('/api/employer/dashboard', requireEmployer, requireEmployerCompany, employerDashboardRouter);
  // Both declare their own full paths (/tags, /applicants/:id/tags, /activity), so they
  // mount on the bare /api/employer prefix like the interview router below.
  app.use('/api/employer', requireEmployer, requireEmployerCompany, employerTagRouter);
  app.use('/api/employer', requireEmployer, requireEmployerCompany, employerActivityRouter);
  app.use('/api/employer', requireEmployer, requireEmployerCompany, employerReferralRouter);
  app.use('/api/employer', requireEmployer, requireEmployerCompany, employerInterviewRouter);
  app.use('/api/employer/jobs', requireEmployer, requireEmployerCompany, employerInterviewTimesRouter);
  app.use('/api/dpdp', dpdpRouter); // per-route guards (D9) — /notice-version is public
  app.use('/api/public/resume-download', resumeDownloadRouter); // signed-token PDF stream (before the apply catch-all)
  app.use('/api/public/company-logo', companyLogoRouter); // unauthenticated careers-page logo (before the apply catch-all)
  app.use('/api/public/culture-photo', culturePhotoRouter); // unauthenticated careers-page photos (before the apply catch-all)
  app.use('/api/public/avatar', employerAvatarRouter); // unauthenticated interviewer photo (before the apply catch-all)
  app.use('/api/public/seeker-avatar', seekerAvatarRouter); // unauthenticated seeker photo (before the apply catch-all)
  app.use('/api/public/invites', publicInviteRouter); // unauthenticated invite preview (before the apply catch-all)
  // DPDP right of access. Unauthenticated by necessity — the emailed one-time token
  // is the credential. Mounted before the apply catch-all.
  app.use('/api/public/dpdp', publicDpdpExportRouter);
  // Shareable candidate profiles (/u/{slug}). Fully public by design — no auth
  // middleware ahead of it; the router itself uses optionalAuth only to avoid
  // counting a seeker's own visit. Before the apply catch-all.
  app.use('/api/public/profile', publicProfileRouter);
  app.use('/api/public/assignment-files', assignmentStagingRouter); // staging upload (before the apply catch-all)
  app.use('/api/public/assignment-download', assignmentDownloadRouter); // signed-token file stream (before the apply catch-all)
  app.use('/api/public', publicInterviewRouter); // unauthenticated interview booking (before the apply catch-all)
  app.use('/api/public', publicApplyRouter); // unauthenticated candidate apply pages

  // ─── 404 + central error handler (must be last) ───────────────────
  app.use(notFound);
  app.use(errorHandler);
}
