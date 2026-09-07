// FILE: src/middleware/require-employer-middleware.js
// Verifies the employer auth cookie and attaches req.employerUser.
// Strictly isolated from the seeker stack: reads ONLY jm_employer_token and
// verifies ONLY with EMPLOYER_JWT_SECRET. It never reads tj_token, so a leaked
// or forged seeker token cannot authenticate against employer routes (C11).

import jwt from 'jsonwebtoken';
import { EMPLOYER_JWT_SECRET, EMPLOYER_COOKIE_NAME } from '../env.js';
import { HttpError } from './error-handler-middleware.js';

export function requireEmployer(req, _res, next) {
  const token = req.cookies?.[EMPLOYER_COOKIE_NAME];
  if (!token) return next(new HttpError(401, 'Unauthorized'));
  try {
    const decoded = jwt.verify(token, EMPLOYER_JWT_SECRET);
    if (!decoded?.employerUserId) return next(new HttpError(401, 'Unauthorized'));
    req.employerUser = { employerUserId: decoded.employerUserId, email: decoded.email };
    next();
  } catch {
    next(new HttpError(401, 'Unauthorized'));
  }
}

/**
 * Attaches req.employerUser when a valid employer cookie is present and does
 * nothing otherwise. For routes that are readable by anyone but show more to a
 * signed-in recruiter — the recruiters-only public profile is the only one today.
 */
export function optionalEmployer(req, _res, next) {
  const token = req.cookies?.[EMPLOYER_COOKIE_NAME];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, EMPLOYER_JWT_SECRET);
    if (decoded?.employerUserId) {
      req.employerUser = { employerUserId: decoded.employerUserId, email: decoded.email };
    }
  } catch { /* an invalid cookie is simply not a recruiter */ }
  next();
}

export default requireEmployer;
