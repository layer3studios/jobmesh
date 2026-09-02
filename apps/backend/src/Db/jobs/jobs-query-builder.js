// FILE: src/Db/jobs/jobs-query-builder.js
// Builds the Mongo filter for the seeker job search: workplace mode, free text,
// city, tags, salary and recency. Split out of queries.js (section 2) -- this is
// the shape of a search, and it changes for product reasons; the file it left
// changes for pagination and caching reasons.



/**
 * Admin-hidden jobs are excluded from every seeker-facing read below.
 * `{ adminHiddenAt: null }` matches documents where the field is null OR
 * absent, so the existing corpus needs no backfill. This is the ONLY hook the
 * admin job browser has into the seeker read path — hiding never touches
 * `Status` (which means expired/inactive) or a native posting's `status`
 * (which belongs to the employer).
 */
export const NOT_ADMIN_HIDDEN = { adminHiddenAt: null };

/**
 * Build the Mongo query for /api/jobs given a set of filters. Returns an
 * object suitable to pass directly to `find()` / `countDocuments()`.
 */
/** Per-mode $or clause. Each mode matches the structured field first, then
 *  falls back to text hints for scraped jobs where WorkplaceType is unset. */
function workplaceClause(mode) {
  if (mode === 'remote') {
    return { $or: [
      { WorkplaceType: { $regex: '^remote$', $options: 'i' } },
      { IsRemote: true },
      { Location: { $regex: '\\bremote\\b', $options: 'i' } },
      { JobTitle: { $regex: '\\bremote\\b', $options: 'i' } },
    ]};
  }
  if (mode === 'hybrid') {
    return { $or: [
      { WorkplaceType: { $regex: '^hybrid(?: job)?$', $options: 'i' } },
      { Location: { $regex: '\\bhybrid\\b', $options: 'i' } },
      { JobTitle: { $regex: '\\bhybrid\\b', $options: 'i' } },
    ]};
  }
  if (mode === 'on-site') {
    return { $or: [
      { WorkplaceType: { $regex: '^(?:on-site|onsite|onsite job|office)$', $options: 'i' } },
      { Location: { $regex: 'on.?site|in-office', $options: 'i' } },
      { JobTitle: { $regex: 'on.?site|in-office', $options: 'i' } },
    ]};
  }
  return null;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** At this length and above, a query is treated as words and goes to $text. */
export const MIN_TEXT_SEARCH_LENGTH = 3;

/** True when this filter carries a $text clause — the caller sorts by relevance. */
export function hasTextSearch(query) {
  if (!query || typeof query !== 'object') return false;
  if (query.$text) return true;
  return Array.isArray(query.$and) && query.$and.some((clause) => clause?.$text);
}

function buildJobsQuery({
  company, workplace, entryLevel,
  roleCategory, experienceBand, techStack, dateFilter, searchFilter,
  locations, salaryMinLpa, salaryMaxLpa,
}) {
  const must = [{ Status: 'active' }, NOT_ADMIN_HIDDEN];

  if (company?.trim()) {
    must.push({ Company: { $regex: escapeRegex(company.trim()), $options: 'i' } });
  }

  // workplace: single value or comma/array of modes — OR within the category.
  const wpModes = (Array.isArray(workplace) ? workplace : (workplace ? workplace.split(',') : []))
    .map(w => w.trim().toLowerCase()).filter(Boolean);
  if (wpModes.length > 0) {
    const clauses = wpModes.map(workplaceClause).filter(Boolean);
    if (clauses.length === 1) must.push(clauses[0]);
    else if (clauses.length > 1) must.push({ $or: clauses });
  }

  if (roleCategory?.trim()) {
    must.push({ 'autoTags.roleCategory': roleCategory.trim() });
  }

  // experienceBand: single value or comma/array of bands — OR within the category.
  const expBands = (Array.isArray(experienceBand) ? experienceBand : (experienceBand ? experienceBand.split(',') : []))
    .map(b => b.trim()).filter(Boolean);
  if (expBands.length > 0) {
    const or = expBands.map(band =>
      ['Fresher (0-1y)', 'fresher', 'Entry Level'].includes(band)
        ? { $or: [{ 'autoTags.experienceBand': band }, { isEntryLevel: true }] }
        : { 'autoTags.experienceBand': band });
    must.push(or.length === 1 ? or[0] : { $or: or });
  } else if (entryLevel) {
    must.push({ $or: [
      { isEntryLevel: true },
      { 'autoTags.experienceBand': 'Fresher (0-1y)' },
    ]});
  }

  // techStack: OR within the category (standard job-site pattern).
  if (Array.isArray(techStack) && techStack.length > 0) {
    const clean = techStack.map(t => t.trim()).filter(Boolean);
    if (clean.length > 0) must.push({ 'autoTags.techStack': { $in: clean } });
  }

  // locations: OR across up to 5 cities, matched against Location + AllLocations.
  if (Array.isArray(locations) && locations.length > 0) {
    const cities = locations.map(c => c.trim()).filter(Boolean).slice(0, 5);
    if (cities.length > 0) {
      must.push({ $or: cities.flatMap(city => {
        const re = { $regex: `\\b${escapeRegex(city)}\\b`, $options: 'i' };
        return [{ Location: re }, { AllLocations: re }];
      })});
    }
  }

  // Salary range in LPA (INR lakhs/year). Only jobs that disclose a salary in
  // INR (or unspecified currency) on a yearly (or unspecified) interval match;
  // job range must overlap the requested range.
  const salMin = Number.isFinite(salaryMinLpa) && salaryMinLpa > 0 ? salaryMinLpa * 100000 : null;
  const salMax = Number.isFinite(salaryMaxLpa) && salaryMaxLpa > 0 ? salaryMaxLpa * 100000 : null;
  if (salMin !== null || salMax !== null) {
    must.push({ $or: [{ SalaryMin: { $ne: null } }, { SalaryMax: { $ne: null } }] });
    must.push({ SalaryCurrency: { $in: [null, 'INR', 'inr', 'Rs', '₹'] } });
    must.push({ SalaryInterval: { $in: [null, 'yearly', 'year', 'annual', 'annually', 'per annum'] } });
    if (salMin !== null) {
      must.push({ $or: [
        { SalaryMax: { $gte: salMin } },
        { SalaryMax: null, SalaryMin: { $gte: salMin } },
      ]});
    }
    if (salMax !== null) {
      must.push({ $or: [
        { SalaryMin: { $lte: salMax } },
        { SalaryMin: null, SalaryMax: { $lte: salMax } },
      ]});
    }
  }

  if (dateFilter) {
    // 'today'/'24h' are what the UI actually sends for the 24-hour bucket.
    const days = { today: 1, '24h': 1, '1d': 1, '3d': 3, '7d': 7, '30d': 30 }[dateFilter];
    if (days) {
      const since = new Date(Date.now() - days * 86400000);
      // FIX: fall back to createdAt/scrapedAt when PostedDate is null —
      // many ATS APIs do not provide it, and we were filtering them out entirely.
      must.push({ $or: [
        { PostedDate: { $gte: since } },
        { PostedDate: null, createdAt: { $gte: since } },
        { PostedDate: { $exists: false }, scrapedAt: { $gte: since } },
      ]});
    }
  }

  // Free text. $text rides the jobs_text_search index (see job-indexes.js); the
  // $regex this replaced could not use any index and scanned the collection.
  //
  // The two paths are not interchangeable, so the length gate is deliberate:
  //   - $text matches whole WORDS (stemmed, case- and diacritic-insensitive), so
  //     "engineering" finds "engineer" but "Jav" does not find "Java".
  //   - a 1-2 character query is almost always someone mid-prefix, which is
  //     exactly what $text cannot do, so those keep the old substring regex.
  const search = searchFilter?.trim();
  if (search && search.length >= MIN_TEXT_SEARCH_LENGTH) {
    must.push({ $text: { $search: search } });
  } else if (search && search.length >= 2) {
    const re = { $regex: escapeRegex(search), $options: 'i' };
    must.push({ $or: [
      { JobTitle: re },
      { Company: re },
      { Location: re },
      { 'autoTags.techStack': re },
      { Department: re },
    ]});
  }

  return must.length === 1 ? must[0] : { $and: must };
}

export { workplaceClause, escapeRegex, buildJobsQuery };
