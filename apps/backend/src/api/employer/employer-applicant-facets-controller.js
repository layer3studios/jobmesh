// FILE: src/api/employer/employer-applicant-facets-controller.js
// GET /jobs/:postingId/applicants/facets -- the skill and city counts behind the
// ranked filter sidebar. Split out of employer-applicants-controller.js
// (section 2): a route file wires URL to handler, and these two handlers answer
// different questions about the same collection.

import { listApplicationsForJob } from '../../models/public/application-model.js';
import { mapContactsByIdForCompany } from '../../models/public/contact-model.js';
import { listResumeScoresForJob } from '../../models/public/resume-score-model.js';

/** Non-city noise seen in free-text contact locations. */
const NON_CITY = new Set(['remote', 'india', 'n/a', 'na', 'anywhere', 'wfh', 'work from home', '']);

function extractCity(raw) {
  if (typeof raw !== 'string') return null;
  const seg = raw.split(/[,/|]/)[0].trim().replace(/\s+/g, ' ');
  if (seg.length < 2 || seg.length > 40 || NON_CITY.has(seg.toLowerCase())) return null;
  return seg;
}

function topCounts(map, cap) {
  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, cap);
}

function countInto(map, value) {
  const key = value.toLowerCase();
  const entry = map.get(key);
  if (entry) entry.count += 1;
  else map.set(key, { value, count: 1 });
}

/**
 * GET .../applicants/facets — filter options scoped to THIS posting:
 * top 30 skills (from AI score matched+bonus skills) and top 20 applicant
 * cities (from contact locations).
 */
export async function listApplicantFacetsForPosting(req, res) {
  const companyId = req.employerCompanyId;
  const jobId = req.posting._id;

  const applications = await listApplicationsForJob(companyId, jobId, {});
  const applicationIds = applications.map((application) => application._id);
  const contactIds = [...new Set(
    applications.map((application) => application.contactId?.toString()).filter(Boolean),
  )];

  const [scores, contactById] = await Promise.all([
    listResumeScoresForJob(companyId, jobId, applicationIds),
    mapContactsByIdForCompany(companyId, contactIds),
  ]);
  const contacts = [...contactById.values()];

  const skillCounts = new Map();
  for (const score of scores) {
    const pool = [...(score.matchedSkills ?? []), ...(score.bonusSkills ?? [])];
    for (const skill of new Set(pool.map((s) => String(s).trim()).filter(Boolean))) {
      countInto(skillCounts, skill);
    }
  }

  const cityCounts = new Map();
  for (const contact of contacts) {
    const city = contact ? extractCity(contact.location) : null;
    if (city) countInto(cityCounts, city);
  }

  res.json({
    skills: topCounts(skillCounts, 30).map((e) => ({ skill: e.value, count: e.count })),
    cities: topCounts(cityCounts, 20).map((e) => ({ city: e.value, count: e.count })),
  });
}
