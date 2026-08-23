// FILE: src/models/employer/posting-projection.js
// The client-safe view of a native posting. Split out of posting-model.js
// (section 2).
//
// This is an ALLOWLIST, and that is the point: companyId, createdByEmployerUserId
// and source are absent by construction rather than by remembering to delete
// them. The public apply route re-projects screeningQuestions on top of this to
// strip knockoutAnswer -- see api/public/apply-projections.js.

/** Client-safe projection — id as string, no internal owner/source fields. */
export function toPublicPosting(doc) {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    descriptionPlain: doc.descriptionPlain,
    location: doc.location,
    workplaceType: doc.workplaceType,
    employmentType: doc.employmentType,
    salaryMin: doc.salaryMin ?? null,
    salaryMax: doc.salaryMax ?? null,
    salaryCurrency: doc.salaryCurrency,
    status: doc.status,
    assignmentId: doc.assignmentId?.toString() ?? null,
    // Employer-side projection: carries knockoutAnswer. The candidate's view is
    // built by toPublicScreeningQuestion, which strips it.
    screeningQuestions: doc.screeningQuestions ?? [],
    applicationDeadline: doc.applicationDeadline ?? null,
    autoCloseOnDeadline: doc.autoCloseOnDeadline === true,
    // Postings created before view counting default to 0 rather than null, so the
    // UI renders "0 views" instead of an empty tile.
    viewCount: doc.viewCount ?? 0,
    postedAt: doc.postedAt ?? null,
    closedAt: doc.closedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
