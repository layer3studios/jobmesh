// FILE: src/api/seeker/seeker-github-routes.js
// The candidate's own GitHub connection. Mounted at /api/seeker/me behind
// requireSeeker, so every route reads and writes exactly one row: the caller's.
//
// Connecting is a VERIFICATION, not a save: the username is only stored once
// GitHub confirms the account exists, so a typo is caught here rather than
// becoming a permanently empty card on the candidate's profile.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/async-handler-middleware.js';
import { HttpError } from '../../middleware/error-handler-middleware.js';
import { GITHUB_ENABLED } from '../../env.js';
import {
  setGitHubUsername, clearGitHubUsername, getGitHubUsername,
} from '../../models/seeker/seeker-github-model.js';
import {
  setCachedGitHub, deleteCachedGitHub,
} from '../../models/seeker/github-cache-model.js';
import {
  fetchGitHubProfile, validateGitHubUsername,
} from '../../services/seeker/github-service.js';
import { readGitHubProfile } from '../../services/seeker/github-read-service.js';

const router = Router();

const NOT_FOUND_MESSAGE = 'No GitHub user with that username.';
const UNAVAILABLE_MESSAGE = 'Could not reach GitHub just now. Try again in a minute.';

/**
 * Distinct from the 404 above: an unconfigured token is an operator problem, and
 * telling the candidate their username is wrong would send them fixing something
 * that was never broken. The card renders this as "integration unavailable".
 */
const DISABLED = () => new HttpError(
  503,
  'GitHub is not configured on this server yet.',
  'GITHUB_DISABLED',
);

/**
 * One manual refresh per 5 minutes per seeker. Keyed by user, not IP: the limit
 * exists to be a good citizen of GitHub's API — whose own limit is per-TOKEN and
 * therefore shared by every user of this server — and two people behind one office
 * NAT should not share a budget.
 */
const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `github-refresh:${req.user.userId}`,
  message: {
    error: 'You can refresh once every 5 minutes. Your saved stats are still shown.',
    code: 'GITHUB_REFRESH_RATE_LIMITED',
  },
});

// PUT /github — connect an account, after verifying it exists.
router.put('/github', asyncHandler(async (req, res) => {
  if (!GITHUB_ENABLED) throw DISABLED();
  const username = validateGitHubUsername(req.body?.username);

  let data;
  try {
    data = await fetchGitHubProfile(username);
  } catch {
    // Nothing is stored on an outage: saving an unverified username would leave a
    // card that silently never fills in.
    throw new HttpError(503, UNAVAILABLE_MESSAGE, 'GITHUB_UNAVAILABLE');
  }
  if (!data) throw new HttpError(404, NOT_FOUND_MESSAGE, 'GITHUB_USER_NOT_FOUND');

  await setGitHubUsername(req.user.userId, username);
  await setCachedGitHub(req.user.userId, username, data);
  res.json({ connected: true, data });
}));

// GET /github — the connected account's stats, fresh or stale.
router.get('/github', asyncHandler(async (req, res) => {
  const username = await getGitHubUsername(req.user.userId);
  if (!username) {
    // `available` lets the card offer the right thing: a connect form, or an
    // explanation that the integration is off. Both are "not connected".
    res.json({ connected: false, available: GITHUB_ENABLED });
    return;
  }
  const data = await readGitHubProfile(req.user.userId, username);
  // Connected but unreadable: still `connected`, because the connection is a fact
  // about the account and the UI should offer Refresh rather than Connect.
  res.json({ connected: true, available: GITHUB_ENABLED, username, data: data ?? null });
}));

// DELETE /github — disconnect and forget.
router.delete('/github', asyncHandler(async (req, res) => {
  await clearGitHubUsername(req.user.userId);
  await deleteCachedGitHub(req.user.userId);
  res.json({ connected: false });
}));

// POST /github/refresh — pull fresh numbers now.
router.post('/github/refresh', refreshLimiter, asyncHandler(async (req, res) => {
  if (!GITHUB_ENABLED) throw DISABLED();
  const username = await getGitHubUsername(req.user.userId);
  if (!username) throw new HttpError(404, 'No GitHub account connected.', 'GITHUB_NOT_CONNECTED');

  const data = await readGitHubProfile(req.user.userId, username, { forceRefresh: true });
  if (!data) {
    throw new HttpError(
      503,
      'Could not reach GitHub just now. Your saved stats are unchanged.',
      'GITHUB_UNAVAILABLE',
    );
  }
  res.json({ connected: true, username, data });
}));

export default router;
