// FILE: src/Db/jobs/queries.js
// Read-side queries for the jobs collection. All return JSON-safe shapes.

import { ObjectId } from 'mongodb';
import { col } from '../connection.js';
import { buildJobsQuery, hasTextSearch, NOT_ADMIN_HIDDEN } from './jobs-query-builder.js';
import { FEED_PROJECTION, clampFeedLimit } from './jobs-feed-projection.js';

const JOBS = 'jobs';

export { NOT_ADMIN_HIDDEN };




// The active-company list only changes when the scraper runs — no reason to
// recompute a distinct() on every feed request.
const COMPANIES_TTL_MS = 10 * 60 * 1000;
let companiesCache = { value: null, at: 0 };

async function getActiveCompaniesCached(jobs) {
  const now = Date.now();
  if (companiesCache.value && now - companiesCache.at < COMPANIES_TTL_MS) {
    return companiesCache.value;
  }
  const value = await jobs.distinct('Company', { Status: 'active', ...NOT_ADMIN_HIDDEN });
  companiesCache = { value, at: now };
  return value;
}

/**
 * Paginated jobs feed used by /api/jobs.
 * Returns { jobs, totalJobs, totalPages, currentPage, companies }.
 */
export async function getJobsPaginated(
  page = 1, limit = 50, companyFilter = null,
  workplaceFilter = null, entryLevelFilter = null, roleCategoryFilter = null,
  experienceBandFilter = null, techStackFilter = [], dateFilter = null, searchFilter = null,
  locationsFilter = [], salaryMinLpa = null, salaryMaxLpa = null,
) {
  const jobs = await col(JOBS);
  // Clamped here rather than only at the route, so no caller can ask this
  // function for the whole collection.
  const safeLimit = clampFeedLimit(limit);
  const skip = (Math.max(1, page) - 1) * safeLimit;
  const query = buildJobsQuery({
    company: companyFilter, workplace: workplaceFilter,
    entryLevel: entryLevelFilter, roleCategory: roleCategoryFilter,
    experienceBand: experienceBandFilter, techStack: techStackFilter,
    dateFilter, searchFilter,
    locations: locationsFilter, salaryMinLpa, salaryMaxLpa,
  });

  // RELEVANCE FIRST, BUT ONLY WHEN SEARCHING. $text ORs its terms, so "software
  // engineer" matches anything with either word; ordering those by date alone
  // would float a weak one-word match above an exact title hit. When no search is
  // active the feed is a reverse-chronological list and must stay one.
  const textSearch = hasTextSearch(query);
  const cursor = jobs.find(query);
  if (textSearch) {
    cursor.project({ ...FEED_PROJECTION, _searchScore: { $meta: 'textScore' } })
      .sort({ _searchScore: { $meta: 'textScore' }, PostedDate: -1 });
  } else {
    cursor.project(FEED_PROJECTION).sort({ PostedDate: -1, scrapedAt: -1 });
  }

  const [totalJobs, rows, companies] = await Promise.all([
    jobs.countDocuments(query),
    cursor.skip(skip).limit(safeLimit).toArray(),
    getActiveCompaniesCached(jobs),
  ]);

  // The score is a sort key, not a field of a job. It has to be projected for
  // Mongo to sort on it, so it is stripped here rather than shipped to a client
  // that has no use for it and no way to interpret it.
  const results = textSearch
    ? rows.map(({ _searchScore, ...job }) => job)
    : rows;

  return {
    jobs: results,
    totalJobs,
    totalPages: Math.max(1, Math.ceil(totalJobs / safeLimit)),
    currentPage: page,
    companies,
  };
}

// ─── Facets ─────────────────────────────────────────────────────────

const FACETS_TTL_MS = 30 * 60 * 1000;
let facetsCache = { value: null, at: 0 };

/** Words that show up as the first Location segment but are not cities. */
const NON_CITY_SEGMENTS = new Set([
  'remote', 'india', 'n/a', 'na', 'anywhere', 'multiple locations', 'pan india',
  'hybrid', 'on-site', 'onsite', 'work from home', 'wfh', '',
]);

function extractCity(raw) {
  if (typeof raw !== 'string') return null;
  // "Bengaluru, Karnataka, India" → "Bengaluru"; also split on "/" and "|".
  const seg = raw.split(/[,/|]/)[0].trim().replace(/\s+/g, ' ');
  if (seg.length < 2 || seg.length > 40) return null;
  if (NON_CITY_SEGMENTS.has(seg.toLowerCase())) return null;
  return seg;
}

/**
 * Filter facets for the /jobs page: top tech-stack tags and top posting
 * cities across active jobs. Heavily cached — aggregate freshness does not
 * matter minute-to-minute.
 */
export async function getJobFacets() {
  const now = Date.now();
  if (facetsCache.value && now - facetsCache.at < FACETS_TTL_MS) {
    return facetsCache.value;
  }

  const jobs = await col(JOBS);
  const [techAgg, locAgg] = await Promise.all([
    jobs.aggregate([
      { $match: { Status: 'active', ...NOT_ADMIN_HIDDEN, 'autoTags.techStack.0': { $exists: true } } },
      { $unwind: '$autoTags.techStack' },
      { $group: { _id: '$autoTags.techStack', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 30 },
    ]).toArray(),
    jobs.aggregate([
      { $match: { Status: 'active', ...NOT_ADMIN_HIDDEN } },
      { $group: { _id: '$Location', count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  // Collapse raw Location strings into city counts (case-insensitive merge).
  const cityCounts = new Map();
  for (const { _id: locationString, count } of locAgg) {
    const city = extractCity(locationString);
    if (!city) continue;
    const key = city.toLowerCase();
    const entry = cityCounts.get(key);
    if (entry) entry.count += count;
    else cityCounts.set(key, { city, count });
  }
  const cities = [...cityCounts.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, 30)
    .map(e => ({ city: e.city, count: e.count }));

  const value = {
    techStack: techAgg.map(t => ({ tag: t._id, count: t.count })),
    cities,
  };
  facetsCache = { value, at: now };
  return value;
}

/** Return up to 50 jobs for any list view that needs a simple paginated dump. */
export async function getAllJobs(page = 1, limit = 50) {
  const jobs = await col(JOBS);
  const skip = (Math.max(1, page) - 1) * limit;
  const [total, results] = await Promise.all([
    jobs.countDocuments(),
    jobs.find({}).sort({ PostedDate: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);
  return {
    jobs: results,
    totalJobs: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    currentPage: page,
  };
}

/** Return the 9 freshest active jobs for the unauthenticated landing page. */
export async function getPublicBaitJobs() {
  const jobs = await col(JOBS);
  return jobs.find({ Status: 'active', ...NOT_ADMIN_HIDDEN })
    .sort({ PostedDate: -1, createdAt: -1 })
    .limit(9)
    .project({
      JobTitle: 1, Company: 1, Location: 1, Department: 1,
      PostedDate: 1, ApplicationURL: 1,
    })
    .toArray();
}

/** Fetch a single job by its Mongo ObjectId string. */
export async function findJobById(id) {
  if (!ObjectId.isValid(id)) return null;
  const jobs = await col(JOBS);
  return jobs.findOne({ _id: new ObjectId(id), ...NOT_ADMIN_HIDDEN });
}
