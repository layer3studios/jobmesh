// FILE: src/services/seo/indexnow-client.js
// IndexNow: tell Bing (and Yandex, Seznam, Naver — they share submissions) the
// moment a public URL is added, changed or removed. ChatGPT search relies
// heavily on Bing's index, so this is how new jobs and blog posts reach it in
// hours instead of weeks. Google does not use IndexNow (it reads the sitemap).
//
// Configuration: INDEXNOW_KEY (8-128 chars, letters, digits, dashes). The
// frontend serves the same key at /indexnow-key.txt, which proves ownership.
// Unset key → every call is a silent no-op, so dev and tests never ping Bing.
//
// Fire-and-forget by design: callers do NOT await success, and a failure only
// logs. A search-engine outage must never fail a scrape or an admin save.

import { PUBLIC_PROFILE_BASE_URL } from '../../env.js';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;
/** Protocol maximum per request. */
const MAX_URLS = 10_000;

export function indexNowConfig(env = process.env, origin = PUBLIC_PROFILE_BASE_URL) {
  const key = env.INDEXNOW_KEY?.trim();
  if (!key || !KEY_RE.test(key) || !/^https:\/\//.test(origin)) return null;
  return { key, origin, host: new URL(origin).host, keyLocation: `${origin}/indexnow-key.txt` };
}

/** Site path(s) → absolute URLs on the public origin. */
export function toPublicUrls(paths, origin = PUBLIC_PROFILE_BASE_URL) {
  return [...new Set(paths.filter(Boolean).map((path) => `${origin}${path.startsWith('/') ? path : `/${path}`}`))];
}

/**
 * Submit paths ('/jobs/abc', '/blog/post') to IndexNow. Resolves to a summary;
 * never rejects.
 */
export async function submitToIndexNow(paths, { config = indexNowConfig(), fetchImpl = fetch } = {}) {
  if (!config || !paths?.length) return { submitted: 0, skipped: true };
  const urlList = toPublicUrls(paths, config.origin).slice(0, MAX_URLS);
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: config.host, key: config.key, keyLocation: config.keyLocation, urlList }),
      signal: AbortSignal.timeout(10_000),
    });
    // 200 = accepted, 202 = accepted pending key check. Anything else is logged.
    if (response.status !== 200 && response.status !== 202) {
      console.warn(`[indexnow] ${urlList.length} URLs rejected: HTTP ${response.status}`);
      return { submitted: 0, status: response.status };
    }
    return { submitted: urlList.length, status: response.status };
  } catch (err) {
    console.warn(`[indexnow] submit failed: ${err.message}`);
    return { submitted: 0, error: err.message };
  }
}

/** Fire-and-forget wrapper for hot paths. */
export function notifyIndexNow(paths) {
  void submitToIndexNow(paths);
}
