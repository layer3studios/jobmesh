// FILE: tests/core/job-liveness.test.js
// The pure half of core/jobLiveness.js: which ATS a job belongs to, and how a
// status or a board answer becomes a verdict. No network — the per-ATS fetches
// are covered by the endpoint probes recorded in that file's header.
//
// The invariant every case here defends: DEAD requires an explicit answer from
// the source. Anything ambiguous must come back UNKNOWN, because the caller
// expires jobs on DEAD and leaves UNKNOWN alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Liveness, __testing } from '../../src/core/jobLiveness.js';

const { identifyJob, verdictFromStatus, verdictFromBoard, slugFromJobId } = __testing;

// ─── Identification ─────────────────────────────────────────────────────────

test('identifies greenhouse from a hosted board URL', () => {
  const t = identifyJob({ ApplicationURL: 'https://boards.greenhouse.io/acme/jobs/4567', JobID: 'greenhouse_acme_4567' });
  assert.equal(t.ats, 'greenhouse');
  assert.equal(t.slug, 'acme');
  assert.equal(t.id, '4567');
});

test('identifies greenhouse behind a company custom domain via gh_jid', () => {
  // The whole reason JobID is consulted: this page is the company's own site
  // and always answers 200, so only the API can say whether the job is gone.
  const t = identifyJob({ ApplicationURL: 'https://helsing.ai/jobs?gh_jid=4019206101', JobID: 'greenhouse_helsing_4019206101' });
  assert.equal(t.ats, 'greenhouse');
  assert.equal(t.slug, 'helsing');
  assert.equal(t.id, '4019206101');
});

test('identifies lever, and distinguishes the EU region', () => {
  const us = identifyJob({ ApplicationURL: 'https://jobs.lever.co/acme/abc-123' });
  assert.equal(us.ats, 'lever');
  assert.equal(us.slug, 'acme');
  assert.equal(us.region, 'us');

  const eu = identifyJob({ ApplicationURL: 'https://jobs.eu.lever.co/acme/abc-123' });
  assert.equal(eu.region, 'eu', 'the EU board is served by a different API host');
});

test('identifies ashby', () => {
  const t = identifyJob({ ApplicationURL: 'https://jobs.ashbyhq.com/acme/0b1c2d3e' });
  assert.equal(t.ats, 'ashby');
  assert.equal(t.slug, 'acme');
  assert.equal(t.id, '0b1c2d3e');
});

test('identifies smartrecruiters and takes the numeric id off the slug', () => {
  const t = identifyJob({ ApplicationURL: 'https://jobs.smartrecruiters.com/Acme/744000012345678-data-engineer' });
  assert.equal(t.ats, 'smartrecruiters');
  assert.equal(t.id, '744000012345678');
});

test('identifies recruitee from the /o/ job path', () => {
  const t = identifyJob({ ApplicationURL: 'https://holepunch.recruitee.com/o/p2p-nodejs-engineer' });
  assert.equal(t.ats, 'recruitee');
  assert.equal(t.slug, 'holepunch');
  assert.equal(t.jobSlug, 'p2p-nodejs-engineer');
});

test('identifies recruitee from the apply variant of the same URL', () => {
  const t = identifyJob({ ApplicationURL: 'https://holepunch.recruitee.com/o/p2p-nodejs-engineer/c/new' });
  assert.equal(t.ats, 'recruitee');
  assert.equal(t.jobSlug, 'p2p-nodejs-engineer');
});

test('identifies personio with its tld', () => {
  const t = identifyJob({ ApplicationURL: 'https://acme.jobs.personio.de/job/123456' });
  assert.equal(t.ats, 'personio');
  assert.equal(t.slug, 'acme');
  assert.equal(t.tld, 'de');
  assert.equal(t.id, '123456');
});

test('identifies workday and rebuilds its cxs API coordinates', () => {
  const t = identifyJob({ ApplicationURL: 'https://acme.wd3.myworkdayjobs.com/en-US/External/job/Bengaluru/Engineer_R-123' });
  assert.equal(t.ats, 'workday');
  assert.equal(t.tenant, 'acme');
  assert.equal(t.site, 'External');
  assert.equal(t.path, '/job/Bengaluru/Engineer_R-123');
});

test('falls back to generic for an unknown host', () => {
  // Workable lands here on purpose: JobMesh stores the jobs.workable.com/view
  // URL, which answers 404 for a job that is gone.
  assert.equal(identifyJob({ ApplicationURL: 'https://jobs.workable.com/view/abc123/role-at-co' }).ats, 'generic');
  assert.equal(identifyJob({ ApplicationURL: 'https://careers.example.com/apply/7' }).ats, 'generic');
});

test('returns null when there is no usable URL', () => {
  assert.equal(identifyJob({ ApplicationURL: 'not-a-url' }), null);
  assert.equal(identifyJob({ ApplicationURL: null }), null);
  assert.equal(identifyJob({}), null);
  assert.equal(identifyJob(null), null);
});

// ─── Verdicts ───────────────────────────────────────────────────────────────

test('only 404 and 410 mean dead; every other failure is unknown', () => {
  assert.equal(verdictFromStatus(200, 'x').verdict, Liveness.LIVE);
  assert.equal(verdictFromStatus(204, 'x').verdict, Liveness.LIVE);
  assert.equal(verdictFromStatus(404, 'x').verdict, Liveness.DEAD);
  assert.equal(verdictFromStatus(410, 'x').verdict, Liveness.DEAD);

  // The ones that would wrongly empty the board if they counted as dead.
  for (const status of [301, 401, 403, 429, 500, 502, 503, 504]) {
    assert.equal(
      verdictFromStatus(status, 'x').verdict,
      Liveness.UNKNOWN,
      `${status} must be UNKNOWN — it says nothing about the posting`,
    );
  }
});

test('a verdict carries a reason naming its source', () => {
  assert.equal(verdictFromStatus(404, 'greenhouse').reason, 'greenhouse 404');
});

test('board answers: on the board is live, missing is dead, unreadable is unknown', () => {
  const board = { state: 'ok', ids: new Set(['a', 'b']) };
  assert.equal(verdictFromBoard(board, 'a', 'ashby').verdict, Liveness.LIVE);
  assert.equal(verdictFromBoard(board, 'zz', 'ashby').verdict, Liveness.DEAD);

  // A board that 404s means the whole company is gone, so its jobs are too.
  assert.equal(verdictFromBoard({ state: 'gone' }, 'a', 'ashby').verdict, Liveness.DEAD);

  // But a board we could not read tells us nothing about any single job.
  const unknown = verdictFromBoard({ state: 'unknown', reason: 'ashby board 503' }, 'a', 'ashby');
  assert.equal(unknown.verdict, Liveness.UNKNOWN);
  assert.equal(unknown.reason, 'ashby board 503');
});

test('slugFromJobId reads the middle segment and tolerates slugs with underscores', () => {
  assert.equal(slugFromJobId('greenhouse_acme_4567', 'greenhouse_'), 'acme');
  assert.equal(slugFromJobId('greenhouse_two_part_4567', 'greenhouse_'), 'two_part');
  assert.equal(slugFromJobId('lever_acme_x', 'greenhouse_'), null);
  assert.equal(slugFromJobId(undefined, 'greenhouse_'), null);
});
