// FILE: src/api/seeker/seeker-leetcode-routes.js
// The candidate's own LeetCode connection. Mounted at /api/seeker/me behind
// requireSeeker, so every route reads and writes exactly one row: the caller's.
//
// Connecting is a VERIFICATION, not a save: the username is only stored once
// LeetCode confirms the account exists, so a typo is caught here rather than
// becoming a permanently empty card on the candidate's profile.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import {
  setLeetCodeUsername, clearLeetCodeUsername, getLeetCodeUsername,
} from '../../models/seeker/seeker-leetcode-model.js';
import {
  setCachedProfile, deleteCachedProfile,
} from '../../models/seeker/leetcode-cache-model.js';
import {
  fetchLeetCodeProfile, validateLeetCodeUsername,
} from '../../services/seeker/leetcode-service.js';
import { readLeetCodeProfile } from '../../services/seeker/leetcode-read-service.js';

const router = Router();

const NOT_FOUND_MESSAGE = 'No LeetCode user with that username.';

/**
 * One manual refresh per 5 minutes per seeker. Keyed by user, not IP: the limit
 * exists to be a good citizen of LeetCode's API, and two people behind one office
 * NAT should not share a budget.
 */
const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `leetcode-refresh:${req.user.userId}`,
  message: {
    error: 'You can refresh once every 5 minutes. Your saved stats are still shown.',
    code: 'LEETCODE_REFRESH_RATE_LIMITED',
  },
});

// PUT /leetcode — connect an account, after verifying it exists.
router.put('/leetcode', asyncHandler(async (req, res) => {
  const username = validateLeetCodeUsername(req.body?.username);

  let data;
  try {
    data = await fetchLeetCodeProfile(username);
  } catch {
    // Nothing is stored on an outage: saving an unverified username would leave a
    // card that silently never fills in.
    throw new HttpError(
      503,
      'Could not reach LeetCode just now. Try connecting again in a minute.',
      'LEETCODE_UNAVAILABLE',
    );
  }
  if (!data) throw new HttpError(404, NOT_FOUND_MESSAGE, 'LEETCODE_USER_NOT_FOUND');

  await setLeetCodeUsername(req.user.userId, username);
  await setCachedProfile(req.user.userId, username, data);
  res.json({ connected: true, data });
}));

// GET /leetcode — the connected account's stats, fresh or stale.
router.get('/leetcode', asyncHandler(async (req, res) => {
  const username = await getLeetCodeUsername(req.user.userId);
  if (!username) {
    res.json({ connected: false });
    return;
  }
  const data = await readLeetCodeProfile(req.user.userId, username);
  // Connected but unreadable: still `connected`, because the connection is a fact
  // about the account and the UI should offer Refresh rather than Connect.
  res.json({ connected: true, username, data: data ?? null });
}));

// DELETE /leetcode — disconnect and forget.
router.delete('/leetcode', asyncHandler(async (req, res) => {
  await clearLeetCodeUsername(req.user.userId);
  await deleteCachedProfile(req.user.userId);
  res.json({ connected: false });
}));

// POST /leetcode/refresh — pull fresh numbers now.
router.post('/leetcode/refresh', refreshLimiter, asyncHandler(async (req, res) => {
  const username = await getLeetCodeUsername(req.user.userId);
  if (!username) throw new HttpError(404, 'No LeetCode account connected.', 'LEETCODE_NOT_CONNECTED');

  const data = await readLeetCodeProfile(req.user.userId, username, { forceRefresh: true });
  if (!data) {
    throw new HttpError(
      503,
      'Could not reach LeetCode just now. Your saved stats are unchanged.',
      'LEETCODE_UNAVAILABLE',
    );
  }
  res.json({ connected: true, username, data });
}));

export default router;
