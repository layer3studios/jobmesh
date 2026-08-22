// FILE: src/services/auth/auth-cookie-options.js
// One definition of the auth-cookie options, shared by all three audiences
// (tj_token, jm_employer_token, jm_admin_token). Audience-neutral by design: the
// caller supplies only the name and lifetime, so the cross-subdomain attributes
// can never drift between the seeker, employer and admin stacks.
//
// NAMING-CONVENTIONS §17 — two attributes make subdomain auth work:
//
//   domain   COOKIE_DOMAIN='.jobmesh.in' scopes the cookie to every subdomain, so
//            a session survives the walk from jobmesh.in to apply.jobmesh.in.
//            Unset in dev: a `domain` on localhost is rejected by some browsers.
//
//   sameSite 'lax', never 'strict'. Strict withholds the cookie on a top-level
//            navigation that originated on another host — clicking a link from
//            hire.jobmesh.in to jobmesh.in would land the user logged out. All
//            *.jobmesh.in hosts are same-SITE, so 'lax' still sends the cookie on
//            cross-subdomain requests while blocking genuine cross-site ones.

import { COOKIE_DOMAIN, IS_PRODUCTION } from '../../env.js';

/**
 * Attributes shared by set and clear. clearCookie only matches a cookie when
 * name, domain and path all agree, so both paths must read from here.
 */
export function baseAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

/** Options for res.cookie(). `maxAgeMilliseconds` is the cookie lifetime. */
export function authCookieOptions(maxAgeMilliseconds) {
  return { ...baseAuthCookieOptions(), maxAge: maxAgeMilliseconds };
}

/** Options for res.clearCookie() — identical minus maxAge. */
export function clearAuthCookieOptions() {
  return baseAuthCookieOptions();
}
