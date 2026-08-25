// FILE: src/services/interview/pool-monitor-service.js
// Pool-low watchdog, piggybacked on the reminder sweep: postings whose pool has
// 0 or 1 available future times get a one-time heads-up email to the company
// founder. Deduplicated via postings.lastPoolLowNotifiedAt (once per 24h).
// Best-effort throughout — this must never fail the sweep.

import { interviewTimesCol, INTERVIEW_TIME_STATUSES } from '../../models/interview/interview-time-model.js';
import { col } from '../../Db/connection.js';
import { mapCompaniesById as defaultGetCompaniesByIds } from '../../models/employer/company-model.js';
import { mapEmployerUsersById as defaultGetEmployerUsersByIds } from '../../models/employer/employer-user-model.js';
import { sendTransactionalEmail as defaultSendEmail } from '../email/send-email-service.js';
import { renderEmailShell, renderPlainText } from '../email/templates/email-layout-helpers.js';

const NOTIFY_COOLDOWN_MILLISECONDS = 24 * 60 * 60 * 1000;
const LOW_POOL_THRESHOLD = 1;

/** Postings whose pool exists but has ≤1 available future time. */
async function findLowPools(now) {
  return (await interviewTimesCol()).aggregate([
    // Any time doc keeps the posting visible even at 0 available (TTL reaps
    // cancelled/past after 30 days, after which a dead pool goes quiet).
    { $group: {
      _id: { postingId: '$postingId', companyId: '$companyId' },
      availableCount: { $sum: { $cond: [{ $and: [
        { $eq: ['$status', INTERVIEW_TIME_STATUSES.AVAILABLE] },
        { $gt: ['$startAtUtc', now] },
      ] }, 1, 0] } },
    } },
    { $match: { availableCount: { $lte: LOW_POOL_THRESHOLD } } },
  ]).toArray();
}

function buildLowPoolEmail(postingTitle, availableCount) {
  const shellInput = {
    previewText: `Interview pool low for ${postingTitle}`,
    headingText: 'Your interview pool is running low',
    bodyBlocks: [
      `Your interview pool for ${postingTitle} has ${availableCount} time${availableCount === 1 ? '' : 's'} remaining.`,
      'Candidates with a scheduling link may find nothing to book. Add more times on the posting settings.',
    ],
    footerLines: ['Sent by JobMesh.'],
  };
  return {
    subject: `Interview pool low: ${postingTitle}`,
    html: renderEmailShell(shellInput),
    text: renderPlainText(shellInput),
  };
}

/**
 * Which of these low pools actually warrant an email: the posting still exists in
 * the right tenant, is active, runs pool scheduling, and is outside its cooldown.
 *
 * Batched. This was a findOne per pool inside the sweep loop; one $in covers the
 * whole pass, and the companyId equality that keeps a pool from reading another
 * tenant's posting is re-checked here rather than delegated to the query.
 */
async function loadNotifiablePostings(pools, cooldownCutoff) {
  const postingsCollection = await col('jobs');
  const postings = await postingsCollection
    .find({ _id: { $in: pools.map((pool) => pool._id.postingId) } })
    .toArray();
  const postingById = new Map(postings.map((posting) => [posting._id.toString(), posting]));

  return pools.flatMap((pool) => {
    const posting = postingById.get(pool._id.postingId?.toString());
    if (!posting) return [];
    // The pool row and the posting must belong to the same company. Previously the
    // findOne filter enforced this; with one batched read it is an explicit check.
    if (String(posting.companyId) !== String(pool._id.companyId)) return [];
    if (posting.status !== 'active' || !posting.interviewDefaults) return [];
    if (posting.lastPoolLowNotifiedAt && posting.lastPoolLowNotifiedAt > cooldownCutoff) return [];
    return [{ pool, posting }];
  });
}

/** One sweep pass. Returns how many notifications were sent. Never throws. */
export async function checkPoolLevelsAndNotify(now = new Date(), deps = {}) {
  const {
    getCompaniesByIds = defaultGetCompaniesByIds,
    getEmployerUsersByIds = defaultGetEmployerUsersByIds,
    sendEmail = defaultSendEmail,
  } = deps;
  let notifiedCount = 0;
  try {
    const lowPools = await findLowPools(now);
    if (lowPools.length === 0) return 0;

    const cooldownCutoff = new Date(now.getTime() - NOTIFY_COOLDOWN_MILLISECONDS);
    const candidates = await loadNotifiablePostings(lowPools, cooldownCutoff);
    if (candidates.length === 0) return 0;

    // Three batched reads replace three queries PER POOL. The founder lookup
    // depends on the companies, so it is the one thing that still waits.
    const companyById = await getCompaniesByIds(candidates.map(({ pool }) => pool._id.companyId));
    const founderById = await getEmployerUsersByIds(
      [...companyById.values()].map((company) => company.claimedByEmployerUserId),
    );

    const stamps = [];
    for (const { pool, posting } of candidates) {
      const company = companyById.get(String(pool._id.companyId));
      const founder = company?.claimedByEmployerUserId
        ? founderById.get(String(company.claimedByEmployerUserId))
        : null;
      if (!founder?.email) continue;

      const { subject, html, text } = buildLowPoolEmail(posting.title, pool.availableCount);
      // Sends stay sequential on purpose: this is an outbound provider with its own
      // rate limits, and a watchdog is never the thing that should saturate it.
      const result = await sendEmail({ to: founder.email, subject, html, text });
      // Stamped whether or not the send landed — exactly as before. The cooldown
      // records that we TRIED, so a hard-failing address cannot become an hourly
      // retry loop against the mail provider.
      stamps.push({
        updateOne: {
          filter: { _id: posting._id },
          update: { $set: { lastPoolLowNotifiedAt: now } },
        },
      });
      if (result.sent) notifiedCount += 1;
    }

    // One write for the whole sweep instead of one per notification.
    if (stamps.length > 0) await (await col('jobs')).bulkWrite(stamps, { ordered: false });
  } catch (err) {
    console.warn(`[pool-monitor] check failed: ${err.message}`);
  }
  return notifiedCount;
}
