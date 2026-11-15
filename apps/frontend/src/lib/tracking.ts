// FILE: src/lib/tracking.ts
// Loaders for the two tag-based trackers — Google Tag Manager (which carries
// GA4) and Microsoft Clarity. PostHog has its own module (lib/posthog.ts)
// because it is an npm package rather than an injected tag.
//
// NOTHING here runs until the visitor accepts analytics cookies. Before a
// choice, and after "Decline", no script is injected, no cookie is set and no
// request leaves the browser. That is the DPDP Act 2023 position the rest of
// this codebase already takes (lib/analytics-consent.ts is the single gate),
// and session recordings in particular need it.
//
// Each tool is switched on by its own NEXT_PUBLIC_* id. Next.js inlines those
// at BUILD time, so they must be present in the server's apps/frontend/.env
// BEFORE `next build` — setting them afterwards does nothing until a rebuild.
// An unset id turns that tool off, so a missing key degrades to "no tracking"
// rather than a crash.
//
// Our own traffic never loads any of this (lib/internal-traffic.ts), which is
// also why a local dev machine cannot pollute production analytics.
import { isTrackingAllowed } from './internal-traffic';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

let gtmStarted = false;
let clarityStarted = false;

/** Ensures window.dataLayer and a gtag() shim exist. Safe to call repeatedly. */
function ensureDataLayer(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // gtag.js expects the `arguments` object itself, not an array — pushing an
      // array makes GA silently ignore the call.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

/**
 * Inject the GTM container (GA4 lives inside it). Idempotent.
 *
 * Google Consent Mode v2 defaults are pushed BEFORE the container loads, which
 * is the only ordering Google honours: a tag that fires before the default is
 * set treats storage as granted. We grant analytics storage only — JobMesh runs
 * no advertising, so every ad_* signal stays denied.
 */
export function startGoogleTagManager(): void {
  if (!GTM_ID || !isTrackingAllowed() || gtmStarted) return;
  gtmStarted = true;

  ensureDataLayer();
  window.gtag!('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

/**
 * Inject Microsoft Clarity (heatmaps + session replay) and pass consent through
 * Clarity's Consent API v2. Without the consentv2 call Clarity runs in a
 * cookieless, heavily degraded mode for visitors it believes need consent.
 * Idempotent; the consent signal is re-sent on every call, so a visitor who
 * declines and later re-accepts is recorded again without a reload.
 */
export function startClarity(): void {
  if (!CLARITY_PROJECT_ID || !isTrackingAllowed()) return;

  if (!clarityStarted) {
    clarityStarted = true;
    // Microsoft's install snippet, typed: queue calls until the tag loads.
    const queued: ClarityShim = window.clarity || (((...args: unknown[]) => {
      (queued.q = queued.q || []).push(args);
    }) as ClarityShim);
    window.clarity = queued;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    document.head.appendChild(script);
  }

  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
}

type ClarityShim = NonNullable<Window['clarity']>;

/**
 * A GA4 page_view for a client-side navigation. GTM's GA4 tag fires on
 * container load only, so pushStates are otherwise invisible to it — the single
 * most common way an SPA under GTM reports one pageview per session.
 * Clarity and PostHog both follow the History API themselves and need no help.
 */
export function trackPageViewGA(url: string, title: string): void {
  if (!gtmStarted || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: url,
    page_location: window.location.origin + url,
    page_title: title,
  });
}

/**
 * GA4 parameter names are conventionally snake_case, while this codebase's event
 * properties are camelCase (analytics-events.ts, D6). Converting here keeps both
 * conventions intact instead of compromising one for the other.
 */
function toSnakeCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Forward one already-PII-stripped event to GA4 (via the GTM dataLayer).
 *
 * GA4 caps an event at 25 parameters and silently drops the rest, so the
 * properties are truncated rather than sent and lost invisibly. Event names
 * reach GA unchanged, so a funnel reads the same in GA as in PostHog.
 */
export function trackEventGA(event: string, properties?: Record<string, unknown>): void {
  if (!gtmStarted || typeof window.gtag !== 'function') return;
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties ?? {}).slice(0, 25)) {
    params[toSnakeCase(key)] = value;
  }
  window.gtag('event', event, params);
}

/**
 * Forward one event to Clarity. Clarity's value here is not counting — it is
 * being able to WATCH the sessions where something happened, so the event name
 * is also set as a filterable tag on the session.
 */
export function trackEventClarity(event: string): void {
  if (!clarityStarted) return;
  window.clarity?.('event', event);
}

/**
 * Tag the current Clarity session so it can be found by a dimension later
 * (for example every session where an apply failed). Values must be strings.
 */
export function setClarityTag(key: string, value: string): void {
  if (!clarityStarted) return;
  window.clarity?.('set', key, value);
}

/**
 * Attach a stable user id to the tag-based tools, so a session in Clarity and a
 * conversion in GA can be tied to the same person PostHog identified.
 * Called on login only. The id is an internal identifier, never an email.
 */
export function identifyForTags(userId: string): void {
  if (typeof window === 'undefined') return;
  window.clarity?.('identify', userId);
  // GA4's user_id must be set on the config, not an event, to apply to the session.
  if (gtmStarted) window.gtag?.('set', { user_id: userId });
}

/**
 * Withdraw consent mid-session: tell GA and Clarity to stop using storage, then
 * delete what they already put on the device. PostHog's own opt-out is handled
 * in its module.
 *
 * Denying analytics_storage is what makes Clarity drop its cookies and end the
 * recording. GA's other kill switch, window['ga-disable-<measurement id>'],
 * is deliberately NOT used: the measurement id lives inside the GTM container,
 * so this app never sees it. Consent Mode is the supported lever here.
 */
export function stopTagTracking(): void {
  if (typeof window === 'undefined') return;

  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });

  // GA cookies: _ga, _ga_<id>, _gid, _gat. Clarity: _clck, _clsk. Both set them
  // on the registrable domain, so expire on this host AND the parent — a cookie
  // deleted on only one of the two comes back on the next pageview.
  const host = window.location.hostname;
  const parent = `.${host.split('.').slice(-2).join('.')}`;
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => /^(_ga|_gid|_gat|_clck|_clsk)/.test(name));

  for (const name of names) {
    for (const domain of ['', host, parent]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}
