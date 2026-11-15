// FILE: src/core/jobLiveness.js
// ─── Job liveness ──────────────────────────────────────────────────────────
//
// Answers one question per job: does the posting still exist at its source?
//
// WHY THIS EXISTS. Until now a job was presumed dead because it was ABSENT
// from our own scrape, and was then hard-deleted (Db/jobs/crud.js
// deleteExpiredJobs). Absence is a weak signal: scraperEngine.js skips a page
// whose fetch throws or returns null — a timeout, a 429, one company's board
// 404ing — and still reports scrapedSuccessfully:true. Every job behind that
// skipped fetch was missing from seenJobIds and was deleted while perfectly
// alive, with no way back. This module replaces the guess with an answer from
// the source itself.
//
// A GET of ApplicationURL is not that answer on most of our platforms —
// verified by probe, 2026-11-16:
//   - apply.workable.com answers 200 for a job id that never existed (SPA).
//   - Ashby and Workday career pages are SPAs too: a deleted id still renders.
//   - Greenhouse custom-domain URLs (company.com/jobs?gh_jid=…) always answer
//     200, because the page is the company's own site.
// So each ATS is asked through its own JSON API, which does return a clean
// "gone" signal. Endpoints below were each probed against a real job AND a
// fabricated one before being trusted:
//
//   greenhouse       GET boards-api/v1/boards/{slug}/jobs/{id}   404 = gone
//   lever            GET api.lever.co/v0/postings/{slug}/{id}    404 = gone
//   smartrecruiters  GET api/v1/companies/{co}/postings/{id}     404, or 200 + active:false
//   workday          GET wday/cxs/{tenant}/{site}{path}          404, or 403 errorCode S22
//   ashby            GET posting-api/job-board/{slug}            id not on board = gone
//   personio         GET {slug}.jobs.personio.{tld}/xml          id not in feed = gone
//   recruitee        GET {slug}.recruitee.com/api/offers/        slug not published = gone
//   everything else  GET ApplicationURL                          404/410 = gone
//
// Workable needs no special case: JobMesh stores the aggregator's
// jobs.workable.com/view/{token} URL, which answers 200 for a real job and 404
// for a fabricated one (probed). The apply.workable.com form does not, which is
// why the distinction is written down here rather than rediscovered later.
//
// THE RULE. Anything ambiguous — a timeout, 5xx, 429, a bot wall, an
// unparseable board — is UNKNOWN, never DEAD. A live job wrongly hidden costs a
// visitor one listing; a dead job shown costs one wasted click. Both matter, but
// only the first is invisible to us, so the bar for DEAD is an explicit answer
// from the source. Callers must treat UNKNOWN as "leave it alone".

export const Liveness = Object.freeze({
  LIVE: 'live',
  DEAD: 'dead',
  UNKNOWN: 'unknown',
});

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const result = (verdict, reason) => ({ verdict, reason });

/**
 * GET with a timeout covering headers AND body. Resolves to
 * { status, ok, url, text(), json() }, or null on any network failure.
 *
 * The body is always read here, inside the timeout, even when only the status
 * is wanted. An undrained response body keeps its socket and buffers alive for
 * the life of the process; a status-only sweep across thousands of jobs is
 * exactly the shape that turns into a slow leak on a 2 GB box.
 */
async function getWithTimeout(url, headers = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, ...headers },
    });
    // The status alone is still a usable answer if the body stalls or is binary.
    const body = await res.text().catch(() => '');
    return {
      status: res.status,
      ok: res.ok,
      url: res.url,
      text: () => body,
      json: () => JSON.parse(body),
    };
  } catch {
    return null; // abort, DNS failure, TLS failure — all ambiguous
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Maps a plain status code onto a verdict. Only 404/410 count as gone. */
function verdictFromStatus(status, source) {
  if (status >= 200 && status < 300) return result(Liveness.LIVE, `${source} ${status}`);
  if (status === 404 || status === 410) return result(Liveness.DEAD, `${source} ${status}`);
  return result(Liveness.UNKNOWN, `${source} ${status}`);
}

/** Safe JSON parse of an already-read body. */
function parseJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

// ─── Identification ─────────────────────────────────────────────────────────

/** Middle segment of `${prefix}{slug}_{id}` JobIDs, or null. */
function slugFromJobId(jobId, prefix) {
  if (typeof jobId !== 'string' || !jobId.startsWith(prefix)) return null;
  const rest = jobId.slice(prefix.length);
  const lastUnderscore = rest.lastIndexOf('_');
  return lastUnderscore > 0 ? rest.slice(0, lastUnderscore) : null;
}

/**
 * Works out which ATS a job lives on and the identifiers its API needs.
 * The URL is the primary signal — it is what a visitor clicks — and JobID fills
 * in the Greenhouse slug that custom-domain URLs do not carry.
 *
 * @returns {{ats:string, [k:string]:string}|null} null when there is no usable URL
 */
export function identifyJob(job) {
  let url;
  try {
    url = new URL(job?.ApplicationURL);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  const jobId = job.JobID || '';

  if (jobId.startsWith('greenhouse_') || host.endsWith('greenhouse.io') || url.searchParams.has('gh_jid')) {
    const slug = slugFromJobId(jobId, 'greenhouse_') || (host.endsWith('greenhouse.io') ? parts[0] : null);
    const id = url.searchParams.get('gh_jid') || (parts[1] === 'jobs' ? parts[2] : null) || jobId.split('_').pop();
    if (slug && /^\d+$/.test(id || '')) return { ats: 'greenhouse', slug, id };
  }

  // https://{slug}.jobs.personio.{de|com}/job/{id}
  const personio = host.match(/^([a-z0-9-]+)\.jobs\.personio\.(de|com)$/);
  if (personio && parts[0] === 'job' && /^\d+$/.test(parts[1] || '')) {
    return { ats: 'personio', slug: personio[1], tld: personio[2], id: parts[1] };
  }

  if (host === 'jobs.ashbyhq.com' && parts.length >= 2) {
    return { ats: 'ashby', slug: parts[0], id: parts[1] };
  }

  if ((host === 'jobs.lever.co' || host === 'jobs.eu.lever.co') && parts.length >= 2) {
    return { ats: 'lever', slug: parts[0], id: parts[1], region: host === 'jobs.eu.lever.co' ? 'eu' : 'us' };
  }

  if (host === 'jobs.smartrecruiters.com' && parts.length >= 2) {
    const id = parts[1].split('-')[0];
    if (/^\d+$/.test(id)) return { ats: 'smartrecruiters', slug: parts[0], id };
  }

  // https://{slug}.recruitee.com/o/{job-slug}[/c/new]
  const recruitee = host.match(/^([a-z0-9-]+)\.recruitee\.com$/);
  if (recruitee && parts[0] === 'o' && parts[1]) {
    return { ats: 'recruitee', slug: recruitee[1], jobSlug: parts[1] };
  }

  if (host.endsWith('.myworkdayjobs.com')) {
    // /{locale?}/{site}/job/{location}/{title_req}
    const jobIdx = parts.indexOf('job');
    if (jobIdx >= 1) {
      return {
        ats: 'workday',
        origin: url.origin,
        tenant: host.split('.')[0],
        site: parts[jobIdx - 1],
        path: `/${parts.slice(jobIdx).join('/')}`,
      };
    }
  }

  return { ats: 'generic' };
}

// ─── Per-ATS checks ─────────────────────────────────────────────────────────

async function checkGreenhouse({ slug, id }) {
  const res = await getWithTimeout(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs/${id}`);
  if (!res) return result(Liveness.UNKNOWN, 'greenhouse network');
  return verdictFromStatus(res.status, 'greenhouse');
}

async function checkLever({ slug, id, region }) {
  const apiHost = region === 'eu' ? 'api.eu.lever.co' : 'api.lever.co';
  const res = await getWithTimeout(`https://${apiHost}/v0/postings/${encodeURIComponent(slug)}/${id}`);
  if (!res) return result(Liveness.UNKNOWN, 'lever network');
  return verdictFromStatus(res.status, 'lever');
}

async function checkSmartRecruiters({ slug, id }) {
  const res = await getWithTimeout(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings/${id}`);
  if (!res) return result(Liveness.UNKNOWN, 'smartrecruiters network');
  // A closed posting still answers 200 — with "active": false — while its job
  // page redirects to /expired. The status alone calls that job live.
  if (res.status === 200) {
    const body = parseJson(res);
    if (body?.active === false) return result(Liveness.DEAD, 'smartrecruiters inactive');
    if (body?.active === true) return result(Liveness.LIVE, 'smartrecruiters active');
    return result(Liveness.UNKNOWN, 'smartrecruiters unreadable');
  }
  return verdictFromStatus(res.status, 'smartrecruiters');
}

async function checkWorkday({ origin, tenant, site, path }) {
  const res = await getWithTimeout(`${origin}/wday/cxs/${tenant}/${site}${path}`, { Accept: 'application/json' });
  if (!res) return result(Liveness.UNKNOWN, 'workday network');

  // An unposted requisition answers 403 with Workday's own JSON error body
  // {"errorCode":"S22",...}. A bot wall also answers 403, but with HTML — so
  // the body, not the status, decides. Without this, every bot wall would read
  // as a dead job and expire a whole tenant.
  if (res.status === 403) {
    const body = parseJson(res);
    if (body?.errorCode === 'S22') return result(Liveness.DEAD, 'workday 403 S22');
    return result(Liveness.UNKNOWN, 'workday 403');
  }
  return verdictFromStatus(res.status, 'workday');
}

/**
 * Fetch a whole board once and share it across every job on it.
 *
 * The cache stores the in-flight PROMISE, not the resolved value, so jobs
 * checked concurrently still cause a single request per board — with 3,000+
 * companies configured, per-job board fetches would be the sweep's bottleneck
 * and a good way to get rate-limited.
 *
 * @param {Map} cache shared for one sweep
 * @param {string} key cache key
 * @param {() => Promise<{state:'ok'|'gone'|'unknown', ids?:Set<string>, reason?:string}>} load
 */
function withBoard(cache, key, load) {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key);
}

/** Turns a resolved board into a verdict for one id on it. */
function verdictFromBoard(board, id, source) {
  if (board.state === 'gone') return result(Liveness.DEAD, `${source} board 404`);
  if (board.state === 'unknown') return result(Liveness.UNKNOWN, board.reason);
  return board.ids.has(id)
    ? result(Liveness.LIVE, `${source} on board`)
    : result(Liveness.DEAD, `${source} not on board`);
}

// Ashby has no public per-job endpoint, so the board is the only answer.
async function checkAshby({ slug, id }, boardCache) {
  const board = await withBoard(boardCache, `ashby|${slug.toLowerCase()}`, async () => {
    const res = await getWithTimeout(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`);
    if (!res) return { state: 'unknown', reason: 'ashby network' };
    if (res.status === 404) return { state: 'gone' };
    if (!res.ok) return { state: 'unknown', reason: `ashby board ${res.status}` };
    const data = parseJson(res);
    if (!Array.isArray(data?.jobs)) return { state: 'unknown', reason: 'ashby unparseable board' };
    return { state: 'ok', ids: new Set(data.jobs.map((j) => String(j.id))) };
  });
  return verdictFromBoard(board, String(id), 'ashby');
}

// Personio's XML feed IS the board; its job page 404s too, but the feed is one
// request per company instead of one per job.
async function checkPersonio({ slug, tld, id }, boardCache) {
  const board = await withBoard(boardCache, `personio|${slug}.${tld}`, async () => {
    const res = await getWithTimeout(`https://${slug}.jobs.personio.${tld}/xml?language=en`);
    if (!res) return { state: 'unknown', reason: 'personio network' };
    if (res.status === 404) return { state: 'gone' };
    if (!res.ok) return { state: 'unknown', reason: `personio feed ${res.status}` };
    const xml = res.text();
    if (!/<workzag-jobs|<position/.test(xml)) return { state: 'unknown', reason: 'personio unparseable feed' };
    return { state: 'ok', ids: new Set([...xml.matchAll(/<id>(\d+)<\/id>/g)].map((m) => m[1])) };
  });
  return verdictFromBoard(board, String(id), 'personio');
}

/**
 * Recruitee publishes the whole board at /api/offers/. Probed 2026-11-16: a
 * fabricated company slug 404s, and each offer carries `slug` plus a `status`
 * that is 'published' while the job is open — so an offer still listed but no
 * longer published counts as gone, the same case SmartRecruiters has.
 */
async function checkRecruitee({ slug, jobSlug }, boardCache) {
  const board = await withBoard(boardCache, `recruitee|${slug.toLowerCase()}`, async () => {
    const res = await getWithTimeout(`https://${slug}.recruitee.com/api/offers/`, { Accept: 'application/json' });
    if (!res) return { state: 'unknown', reason: 'recruitee network' };
    if (res.status === 404) return { state: 'gone' };
    if (!res.ok) return { state: 'unknown', reason: `recruitee board ${res.status}` };
    const data = parseJson(res);
    if (!Array.isArray(data?.offers)) return { state: 'unknown', reason: 'recruitee unparseable board' };
    const published = data.offers.filter((o) => o?.status === 'published' && o?.slug);
    return { state: 'ok', ids: new Set(published.map((o) => String(o.slug))) };
  });
  return verdictFromBoard(board, String(jobSlug), 'recruitee');
}

async function checkGeneric(job) {
  const res = await getWithTimeout(job.ApplicationURL);
  if (!res) return result(Liveness.UNKNOWN, 'generic network');

  // Greenhouse-hosted boards redirect a closed job back to the board root with
  // ?error=true rather than returning 404, so the final URL is the only signal.
  if (res.url && /[?&]error=true\b/.test(res.url)) return result(Liveness.DEAD, 'redirected to error page');
  return verdictFromStatus(res.status, 'generic');
}

/**
 * Checks one job against its source.
 *
 * @param {object} job needs ApplicationURL; JobID improves Greenhouse coverage
 * @param {{boardCache?: Map}} [options] pass ONE Map per sweep to share board fetches
 * @returns {Promise<{verdict:'live'|'dead'|'unknown', reason:string, ats:string}>}
 */
export async function checkJobLiveness(job, { boardCache = new Map() } = {}) {
  const target = identifyJob(job);
  if (!target) return { ...result(Liveness.UNKNOWN, 'no usable URL'), ats: 'none' };

  let outcome;
  switch (target.ats) {
    case 'greenhouse': outcome = await checkGreenhouse(target); break;
    case 'lever': outcome = await checkLever(target); break;
    case 'smartrecruiters': outcome = await checkSmartRecruiters(target); break;
    case 'personio': outcome = await checkPersonio(target, boardCache); break;
    case 'recruitee': outcome = await checkRecruitee(target, boardCache); break;
    case 'workday': outcome = await checkWorkday(target); break;
    case 'ashby': outcome = await checkAshby(target, boardCache); break;
    default: outcome = await checkGeneric(job);
  }
  return { ...outcome, ats: target.ats };
}

export const __testing = { identifyJob, verdictFromStatus, verdictFromBoard, slugFromJobId };
