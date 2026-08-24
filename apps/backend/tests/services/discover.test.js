// FILE: tests/services/discover.test.js
// The Discover funnel's decidable parts: skill resolution, ranking, review
// normalisation, and — most importantly — that the eligibility rule is
// company-scoped.
import './../_helpers/test-db.js';
import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { dropCollections, closeTestDb } from '../_helpers/test-db.js';
import { col } from '../../src/Db/connection.js';
import { postingSkillSet, seekerSkillSet, findCandidatePool } from '../../src/services/employer/discover-pool-service.js';
import { scoreCandidate, rankCandidates, MAX_PROOF_BONUS } from '../../src/services/employer/discover-score-service.js';
import { generateMicroReview, buildSeekerSummary } from '../../src/services/employer/discover-ai-review-service.js';

const reset = () => dropCollections('jobs', 'applications', 'contacts', 'users');
before(reset);
beforeEach(reset);
after(async () => { await closeTestDb(); });

// ── skill resolution ────────────────────────────────────────────────────────
test('posting skills come from parsedRequirements, not autoTags', () => {
  assert.equal(postingSkillSet({ autoTags: { techStack: ['react'] } }).size, 0,
    'autoTags belong to scraped jobs and must not be read here');
  const skills = postingSkillSet({
    parsedRequirements: { required_skills: ['React.js'], preferred_skills: ['Node.js'] },
  });
  assert.ok(skills.has('react') && skills.has('node'), 'aliases fold to canonical form');
});

test('seeker skills are read from both storage shapes', () => {
  const set = seekerSkillSet({
    skills: ['TypeScript'],
    parsedProfile: { skills: [{ name: 'PostgreSQL' }, 'Kubernetes'] },
  });
  assert.ok(set.has('ts') && set.has('postgres') && set.has('k8s'));
});

// ── ranking ─────────────────────────────────────────────────────────────────
const postingSkills = () => postingSkillSet({
  parsedRequirements: { required_skills: ['react', 'node', 'typescript', 'aws'] },
});

test('skill overlap outranks every proof-of-work bonus combined', () => {
  const skills = postingSkills();
  const strongSkills = scoreCandidate({ _id: new ObjectId(), skills: ['react', 'node', 'typescript', 'aws'] }, skills, null, null);
  const allBadges = scoreCandidate(
    { _id: new ObjectId(), skills: ['react'], lastResumeHash: 'x' }, skills,
    { hardSolved: 100, contestRating: 3000 },
    { totalContributions: 100000, totalStars: 10000 },
  );
  assert.ok(strongSkills.totalScore > allBadges.totalScore,
    'a well-matched candidate must not be beaten by badges alone');

  // The invariant behind that: every bonus combined is worth less than one skill,
  // so badges can only ever reorder candidates who match equally well.
  const maxedOut = scoreCandidate(
    { _id: new ObjectId(), skills: [], lastResumeHash: 'x' }, skills,
    { hardSolved: 999, contestRating: 9999 }, { totalContributions: 1e9, totalStars: 1e9 },
  );
  assert.equal(maxedOut.totalScore, MAX_PROOF_BONUS, 'bonus ceiling is what the weight assumes');
  const oneSkill = scoreCandidate({ _id: new ObjectId(), skills: ['react'] }, skills, null, null);
  assert.ok(oneSkill.totalScore > MAX_PROOF_BONUS, 'one skill beats a maxed-out badge sweep');
});

test('matched skills are reported in the candidate own wording', () => {
  const result = scoreCandidate({ _id: new ObjectId(), skills: ['React.js', 'Golang'] }, postingSkills(), null, null);
  assert.deepEqual(result.matchedSkills, ['React.js'], 'not the canonical "react"');
  assert.equal(result.matchedSkillCount, 1);
});

test('aliases of one skill are counted once, not twice', () => {
  const result = scoreCandidate(
    { _id: new ObjectId(), skills: ['React', 'react.js', 'ReactJS'] }, postingSkills(), null, null,
  );
  assert.equal(result.matchedSkillCount, 1, 'three spellings of React are one skill');
});

test('ranking is score-desc and capped', () => {
  const rows = [{ totalScore: 5, matchedSkillCount: 1 }, { totalScore: 50, matchedSkillCount: 5 },
    { totalScore: 20, matchedSkillCount: 2 }];
  assert.deepEqual(rankCandidates(rows, 2).map((r) => r.totalScore), [50, 20]);
});

// ── the eligibility rule ────────────────────────────────────────────────────
async function seedConsentingSeeker({ companyId, postingId, consent, email }) {
  const contactId = new ObjectId();
  await (await col('contacts')).insertOne({ _id: contactId, companyId, email });
  await (await col('applications')).insertOne({
    companyId, contactId, jobId: new ObjectId(), // a DIFFERENT posting at this company
    consent: { futureOpportunitiesConsent: consent },
  });
  await (await col('users')).insertOne({ email, name: 'Asha', skills: ['react', 'node'] });
  return contactId;
}

const seedPosting = async (companyId) => {
  const postingId = new ObjectId();
  await (await col('jobs')).insertOne({
    _id: postingId, companyId, title: 'Frontend Engineer',
    parsedRequirements: { required_skills: ['react', 'node'] },
  });
  return postingId;
};

test('a consenting past applicant at this company is eligible', async () => {
  const companyId = new ObjectId();
  const postingId = await seedPosting(companyId);
  await seedConsentingSeeker({ companyId, postingId, consent: true, email: 'asha@example.com' });

  const { seekers } = await findCandidatePool(companyId, postingId);
  assert.equal(seekers.length, 1);
  assert.equal(seekers[0].email, 'asha@example.com');
});

test('consent given to ANOTHER company never leaks into this one pool', async () => {
  // The apply form promises "future roles at {companyName}". Honouring that
  // promise is the entire reason this pool is built per-company.
  const otherCompanyId = new ObjectId();
  const companyId = new ObjectId();
  const postingId = await seedPosting(companyId);
  await seedConsentingSeeker({
    companyId: otherCompanyId, postingId, consent: true, email: 'asha@example.com',
  });

  const { seekers } = await findCandidatePool(companyId, postingId);
  assert.deepEqual(seekers, [], 'a seeker who never applied HERE must not be surfaced');
});

test('withheld consent excludes a seeker who did apply here', async () => {
  const companyId = new ObjectId();
  const postingId = await seedPosting(companyId);
  await seedConsentingSeeker({ companyId, postingId, consent: false, email: 'asha@example.com' });

  const { seekers } = await findCandidatePool(companyId, postingId);
  assert.deepEqual(seekers, []);
});

test('someone who already applied to THIS posting is not suggested again', async () => {
  const companyId = new ObjectId();
  const postingId = await seedPosting(companyId);
  const contactId = await seedConsentingSeeker({
    companyId, postingId, consent: true, email: 'asha@example.com',
  });
  await (await col('applications')).insertOne({
    companyId, contactId, jobId: postingId, consent: { futureOpportunitiesConsent: true },
  });

  const { seekers } = await findCandidatePool(companyId, postingId);
  assert.deepEqual(seekers, []);
});

test('a posting with no extracted requirements yields nobody, not everybody', async () => {
  const companyId = new ObjectId();
  const postingId = new ObjectId();
  await (await col('jobs')).insertOne({ _id: postingId, companyId, title: 'Mystery role' });
  await seedConsentingSeeker({ companyId, postingId, consent: true, email: 'asha@example.com' });

  const { seekers } = await findCandidatePool(companyId, postingId);
  assert.deepEqual(seekers, [], 'no requirements means no basis to match on');
});

test('a cross-tenant postingId is 404, never another company pool', async () => {
  const postingId = await seedPosting(new ObjectId());
  await assert.rejects(
    () => findCandidatePool(new ObjectId(), postingId),
    (err) => err.status === 404 && err.code === 'POSTING_NOT_FOUND',
  );
});

// ── AI review normalisation ─────────────────────────────────────────────────
const fakeClient = (text) => ({ generateContent: async () => text });
const summary = () => buildSeekerSummary({ matchedSkills: ['react'], allSkills: ['react'] });
const posting = { title: 'Frontend Engineer', parsedRequirements: { required_skills: ['react'] } };

test('a well-formed answer is parsed', async () => {
  const result = await generateMicroReview(summary(), posting, {
    enabled: true, client: fakeClient('{"review":"They match. They ship.","rating":"STRONG"}'),
  });
  assert.deepEqual(result, { review: 'They match. They ship.', rating: 'strong' });
});

test('an unknown rating defaults DOWN to possible, never up', async () => {
  const result = await generateMicroReview(summary(), posting, {
    enabled: true, client: fakeClient('{"review":"Some prose.","rating":"AMAZING"}'),
  });
  assert.equal(result.rating, 'possible', 'overselling a candidate costs a wasted call');
});

test('a chatty model is trimmed to two sentences', async () => {
  const result = await generateMicroReview(summary(), posting, {
    enabled: true,
    client: fakeClient('Sure! {"review":"One. Two. Three. Four.","rating":"GOOD"}'),
  });
  assert.equal(result.review, 'One. Two.', 'JSON is recovered from the preamble and capped');
});

test('every failure mode yields null rather than throwing', async () => {
  assert.equal(await generateMicroReview(summary(), posting, { enabled: false }), null);
  assert.equal(await generateMicroReview(summary(), posting, {
    enabled: true, client: fakeClient('not json at all'),
  }), null);
  assert.equal(await generateMicroReview(summary(), posting, {
    enabled: true, client: { generateContent: async () => { throw new Error('502'); } },
  }), null, 'an AI outage must not fail the tab');
});
