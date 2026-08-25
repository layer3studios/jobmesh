// FILE: src/api/employer/employer-postings-list-controller.js
// GET /api/employer/jobs — the paged postings list. Split out of
// employer-postings-routes.js, which is a mounting table; this is the one handler
// there with enough logic (paging arithmetic, a parallel count, a grouped
// applicant tally) to be worth reading on its own.

import { validatePostingStatus } from '../../services/employer/posting-validators.js';
import {
  listPostingsForCompany, countPostingsForCompany, toPublicPosting,
} from '../../models/employer/posting-model.js';
import { countApplicationsForJobs } from '../../models/public/application-model.js';

const POSTINGS_DEFAULT_LIMIT = 25;
const POSTINGS_MAX_LIMIT = 50;

// GET /api/employer/jobs?status=&page=&limit= — list, newest first.
//
// PAGED, BUT COMPATIBLY. The body still leads with `postings`, so every existing
// reader keeps working untouched; page/limit/totalCount are added beside it. A
// caller that needs the whole set (the assignments page computes usage across all
// of them) must follow totalCount rather than assume one response is everything.
export async function listPostingsForCompanyRoute(req, res) {
  const filter = {};
  if (req.query.status !== undefined) filter.status = validatePostingStatus(req.query.status);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const requested = parseInt(req.query.limit, 10) || POSTINGS_DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requested, 1), POSTINGS_MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [postings, totalCount] = await Promise.all([
    listPostingsForCompany(req.employerCompanyId, { ...filter, limit, skip }),
    countPostingsForCompany(req.employerCompanyId, filter),
  ]);
  // One grouped count for the whole page, never a query per row.
  const counts = await countApplicationsForJobs(
    req.employerCompanyId, postings.map((posting) => posting._id),
  );
  res.json({
    postings: postings.map((posting) => ({
      ...toPublicPosting(posting),
      applicantCount: counts.get(posting._id.toString()) ?? 0,
    })),
    totalCount,
    page,
    limit,
  });
}
