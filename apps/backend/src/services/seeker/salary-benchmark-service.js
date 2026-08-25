// FILE: src/services/seeker/salary-benchmark-service.js
// getSalaryBenchmarkForUser(userId) — P25/P50/P75 salary band over the matching
// slice of the `jobs` pool (D4). Percentiles, not averages, because outliers
// skew means (R1). Below MIN_SAMPLE_SIZE the percentiles are null and only
// sampleSize is reported so the frontend can show "not enough data" (R1).
// userId-scoped (C8): profile loaded via getProfileForUser, cache key embeds it.

import { col } from '../../Db/connection.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { getProfileForUser } from '../../models/seeker/seeker-profile-helpers.js';
import { marketCache } from './market-cache.js';
import { buildBaseJobMatch } from './profile-match-helpers.js';

export const MIN_SAMPLE_SIZE = 10;
const CURRENCY = 'INR';
const UNIT = 'LPA';

// Linear-interpolation percentile over an ascending array. Rounded to 0.5 LPA.
function percentile(sorted, fraction) {
  if (sorted.length === 1) return sorted[0];
  const rank = fraction * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const value = sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
  return Math.round(value * 2) / 2;
}

/** Salary benchmark for a seeker, scoped to their seniority when known. */
export async function getSalaryBenchmarkForUser(userId) {
  const profile = await getProfileForUser(userId);
  if (!profile) throw new HttpError(400, 'No parsed profile found.', 'NO_PROFILE');

  const seniority = profile.seniorityLevel ?? null;
  const filters = { seniority, roleCategory: null, location: null };
  const cacheKey = `salary:${userId}`;
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  const now = Date.now();
  const match = buildBaseJobMatch(now);
  match['parsedRequirements.salary_range_inferred'] = { $exists: true, $ne: null };
  if (seniority) match['parsedRequirements.experience_level'] = seniority;

  // The midpoint and the sort happen IN MONGO; only an ascending array of numbers
  // crosses the wire. This used to pull whole job documents — four copies of the
  // description apiece — to read one nested pair of numbers from each.
  //
  // salaryMidpoint's rule (both bounds → mean, one bound → that bound, neither →
  // skip) is $avg over the numeric bounds: $avg of a one-element array is that
  // element, and $filter drops anything non-numeric exactly as the `typeof` guard
  // did. The percentile maths stays in JS — it is pure, tested, and interpolates
  // in a way $percentile does not reproduce.
  const jobs = await col('jobs');
  const rows = await jobs.aggregate([
    { $match: match },
    { $project: {
      _id: 0,
      midpoint: { $let: {
        vars: { bounds: { $filter: {
          input: [
            '$parsedRequirements.salary_range_inferred.min',
            '$parsedRequirements.salary_range_inferred.max',
          ],
          cond: { $isNumber: '$$this' },
        } } },
        in: { $cond: [{ $gt: [{ $size: '$$bounds' }, 0] }, { $avg: '$$bounds' }, null] },
      } },
    } },
    { $match: { midpoint: { $ne: null } } },
    { $sort: { midpoint: 1 } },
  ]).toArray();

  const midpoints = rows.map((row) => row.midpoint);
  const sampleSize = midpoints.length;

  let p25 = null;
  let p50 = null;
  let p75 = null;
  if (sampleSize >= MIN_SAMPLE_SIZE) {
    p25 = percentile(midpoints, 0.25);
    p50 = percentile(midpoints, 0.5);
    p75 = percentile(midpoints, 0.75);
  }

  const result = {
    p25, p50, p75, sampleSize,
    currency: CURRENCY, unit: UNIT, filters,
    asOf: new Date(now).toISOString(),
  };
  marketCache.set(cacheKey, result);
  return result;
}

export default getSalaryBenchmarkForUser;
