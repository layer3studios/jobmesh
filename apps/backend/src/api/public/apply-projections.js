// FILE: src/api/public/apply-projections.js
// Client-safe projections for the PUBLIC apply + careers responses. Split out of
// public-apply-routes.js, which was over the 200-line cap.
//
// Everything here exists to answer one question: what may an unauthenticated
// candidate see? Keeping the projections together — rather than inline beside the
// routes — is what makes that question answerable by reading one file.

import { toPublicPosting } from '../../models/employer/posting-model.js';
import { toPublicScreeningQuestion } from '../../services/employer/screening-question-validators.js';

export function companySummary(company) {
  return {
    name: company.name,
    tagline: company.tagline ?? null,
    about: company.about ?? null,
    socialLinks: company.socialLinks ?? null,
    slug: company.slug,
    website: company.website ?? null,
    logoUrl: company.logoUrl ?? null,
    // The careers page renders this between the masthead and the roles. null on a
    // company that never configured one — the section is then not rendered at all.
    cultureSection: company.cultureSection ?? null,
  };
}
// workplaceType and postedAt are here so the careers page can render a workplace
// badge and a posted-recency value without a second request per job. Both already
// exist on every native posting; they were simply never projected.
export function jobSummary(posting) {
  return {
    id: posting._id.toString(), slug: posting.slug, title: posting.title,
    location: posting.location, employmentType: posting.employmentType,
    workplaceType: posting.workplaceType ?? null,
    postedAt: posting.postedAt ?? null,
  };
}

/**
 * THE FULL TASK IS NOT SECRET, AND MUST NOT BE GATED.
 *
 * This apply page is public and unauthenticated: anyone can open it without
 * applying, and take-home tasks circulate publicly regardless of what we do. So
 * the API returns the complete assignment — description and all — in one response.
 * Showing the summary first and the full task on click is a UX choice the frontend
 * makes; it is NOT a security boundary. Do not add a token, a "reveal" endpoint,
 * or truncation here later: it would buy nothing and would break the candidate who
 * wants to read the task before deciding to apply.
 *
 * Neither projection exposes companyId, createdByEmployerUserId, archivedAt or
 * timestamps — those are employer-side fields.
 */
export function assignmentSummary(assignment) {
  // The LIST badge only: "≈4h · pdf, zip". No task text on a company page.
  return {
    estimatedHours: assignment.estimatedHours ?? null,
    allowedFileTypes: assignment.allowedFileTypes ?? [],
  };
}

export function publicAssignment(assignment) {
  // The DETAIL page: everything a candidate needs to decide and to answer.
  return {
    id: assignment._id.toString(),
    title: assignment.title ?? null,
    publicSummary: assignment.publicSummary ?? null,
    descriptionMarkdown: assignment.descriptionMarkdown ?? null,
    submissionInstructionsMarkdown: assignment.submissionInstructionsMarkdown ?? null,
    estimatedHours: assignment.estimatedHours ?? null,
    allowedFileTypes: assignment.allowedFileTypes ?? [],
  };
}

/**
 * The job detail a candidate sees.
 *
 * toPublicPosting is shared with the EMPLOYER routes and its screeningQuestions
 * carry knockoutAnswer, so they are re-projected here through the candidate-safe
 * mapper. A candidate who could see which answer is flagged would simply avoid it,
 * which would make the whole feature worthless to the employer.
 */
export function publicJob(posting) {
  const { screeningQuestions, ...job } = toPublicPosting(posting);
  return { ...job, screeningQuestions: (screeningQuestions ?? []).map(toPublicScreeningQuestion) };
}
