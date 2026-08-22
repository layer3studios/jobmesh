// FILE: src/middleware.ts
// Subdomain → route-group routing (NAMING-CONVENTIONS §17). Each audience gets its
// own host in production; this rewrites the incoming path into the route group that
// already serves it, so no page component moves and every existing path-based URL
// keeps working.
//
//   hire.jobmesh.in/jobs    → /employer/jobs      (route group (employer))
//   admin.jobmesh.in/team   → /admin/team         (route group (admin))
//   apply.jobmesh.in/acme   → /apply/acme         (route group (apply))
//   health.jobmesh.in/*     → /api/health         (route handler)
//   jobmesh.in/*            → served as-is        (route group (seeker))
//
// In local dev there are no subdomains, so routing is skipped entirely and
// localhost:3001/employer keeps behaving exactly as it did before this file existed.
import { NextResponse, type NextRequest } from 'next/server';
import { PATH_PREFIX_BY_AUDIENCE, isLocalHostname, resolveAudience } from './lib/subdomain';

/** Paths the 'apply' host serves without the /apply prefix (booking links). */
const APPLY_PASSTHROUGH_PREFIXES = ['/apply', '/interview'];

/**
 * Root resources that belong to the HOST, not to an audience, and must never be
 * prefixed. robots.txt in particular is per-host by definition — prefixing it to
 * /apply/robots.txt matches the careers route and serves a PAGE where a crawler
 * expects a text file. These still flow through rewriteTo() so the handler can
 * read x-subdomain and vary its output per host.
 */
const ROOT_PASSTHROUGH_PATHS = ['/robots.txt', '/sitemap.xml', '/manifest.json', '/favicon.ico'];

/** Route handlers live at /api on the Next tier (health). Never audience-prefixed. */
const ROOT_PASSTHROUGH_PREFIXES = ['/api/'];

function isRootPassthrough(pathname: string): boolean {
  return ROOT_PASSTHROUGH_PATHS.includes(pathname)
    || ROOT_PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Echoed to the response and injected into the request so layouts can read it. */
const SUBDOMAIN_HEADER = 'x-subdomain';

/**
 * Rewrite while preserving search params. The hash fragment never reaches the
 * server, so it survives automatically — the browser reapplies it after the rewrite.
 */
function rewriteTo(request: NextRequest, pathname: string, subdomain: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  // Forward the active subdomain as a REQUEST header so Server Components can read
  // it via headers(); a response header alone is invisible to them.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SUBDOMAIN_HEADER, subdomain);

  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  response.headers.set(SUBDOMAIN_HEADER, subdomain);
  return response;
}

/** Prefix `pathname` with the audience's base path, collapsing the root case. */
function prefixedPath(prefix: string, pathname: string): string {
  // Trailing slashes: '/employer/' and '/employer' must resolve identically.
  const normalized = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (normalized === '/' || normalized === '') return prefix;
  return normalized.startsWith(`${prefix}/`) || normalized === prefix
    ? normalized
    : `${prefix}${normalized}`;
}

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get('host');

  // Dev, or a proxy that stripped Host: fall through to path-based routing.
  if (!hostHeader || isLocalHostname(hostHeader) || process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const { audience, subdomain, isKnown, isWww } = resolveAudience(hostHeader);

  // www → bare domain, 301, path and query preserved.
  if (isWww) {
    const url = request.nextUrl.clone();
    url.host = hostHeader.replace(/^www\./i, '');
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  // foo.jobmesh.in — rewrite to a path no route matches so Next renders the
  // branded not-found.tsx with a 404. A redirect here would loop.
  if (!isKnown) {
    return rewriteTo(request, '/_subdomain-not-found', subdomain ?? 'unknown');
  }

  // api.jobmesh.in is Nginx's job. Reaching Next means the vhost is misconfigured.
  if (audience === 'api') {
    return NextResponse.json(
      { error: 'API requests should go to the backend' },
      { status: 502 },
    );
  }

  const pathname = request.nextUrl.pathname;

  // Host-level resources (robots.txt, sitemap.xml, /api/*) keep their path on
  // every audience host; only the x-subdomain hint is attached.
  if (audience !== 'health' && isRootPassthrough(pathname)) {
    return rewriteTo(request, pathname, subdomain ?? '');
  }

  // health.jobmesh.in collapses every path onto the health route handler.
  if (audience === 'health') {
    return rewriteTo(request, PATH_PREFIX_BY_AUDIENCE.health, 'health');
  }

  // Bare domain — seeker pages already live at the root, so nothing to rewrite.
  if (audience === 'seeker') {
    return rewriteTo(request, pathname, '');
  }

  // apply.jobmesh.in also serves /interview/<token> unprefixed.
  if (audience === 'apply' && APPLY_PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return rewriteTo(request, pathname, 'apply');
  }

  return rewriteTo(request, prefixedPath(PATH_PREFIX_BY_AUDIENCE[audience], pathname), subdomain!);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
