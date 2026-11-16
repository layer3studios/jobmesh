# JobMesh feature backlog

What job seekers are actually asking for, what JobMesh already has, and what each
gap costs to close.

Sources, in order of weight:

1. **r/developersIndia threads, Nov 2026** — read via Google result pages, since
   reddit.com is blocked in this environment. Quoted verbatim below.
2. **Published surveys** — Monster (n=1,002), iHire, Criteria, Glassdoor/Harris.
   Vendor-sponsored, so treat exact percentages as directional.
3. **The JobMesh codebase and live index** — verified directly, November 2026.

---

## What the current generation actually says

Not paraphrased. These are the complaints, in their words.

### Silence, not rejection — the dominant theme

> "Not Even Rejections… Just Silence After 1000+ Job applications"

> "Forget about getting interview calls, I am not even receiving any rejection
> email. Have HR even forgot to reject candidates?"

> "I have applied to over 500+ jobs in past 4 months and have received some calls
> only (some were fake) or just ghosted after submitting assignment"

> "Please Roast My Resume. Have applied to 60+ jobs with 0 [responses]"

Corroborated: **53%** report being ghosted in the past year, a three-year high,
up from 48% and 38% (Criteria 2026). **84%** want status within a week; **82%**
say companies do not communicate (Glassdoor/Harris). **60%** say not knowing
whether a human saw the application is their single biggest frustration
(Monster, n=1,002).

### Ghost jobs and scams — stated concretely

> "half the listings on LinkedIn and Naukri are either 'ghost jobs' that actually
> closed 3 weeks ago, or fake training consultancies"

> "so many of these postings are fake, expired within minutes, or completely
> unresponsive"

> "Went for a job interview applied from naukari, turned out to be an insidious
> scam"

> "DO NOT BUY NAUKRI PAID SERVICES ITS A SCAM"

Guides converge on one filter: **is the role on the company's own careers page.**
Described as the single best filter that exists.

### Interview prep is a moving target — the sharpest new finding

> "I prepare DSA and system design, but get asked deep Java GC and Spring Boot
> internals. I prepare those, and the next interview throws a hard DSA problem."

> "I was told to prepare for Data Engineering system design, but was asked to
> design a scheduler instead"

> "You are supposed to use AI for development but not too much"

The problem is **not** "DSA vs system design". It is not knowing what *this*
company asks.

### They are building these tools themselves

Unmet demand with proof of effort:

- *"a searchable list of open jobs pulled straight from [company career pages]"*
  — **this is literally JobMesh's architecture**
- *"a tool that shows you where your ex-colleagues actually got hired"* — 80+ comments
- job trackers, auto-appliers, filtered indexes

### Market pessimism

> "the job market is so bad right now that I have started asking for less just
> because I don't want to lose an opportunity"

> "Stay in your town and start alternate income source. Moving to Bengaluru isn't
> worth it"

> "I would highly suggest you to pivot away from this field as it is highly saturated"

---

## One finding that should shape everything

iHire: **20.9%** of job seekers say job boards already have *too many* AI tools.
Only **3.2%** want more.

This argues against AI features as a differentiator, and for trust, verification
and plain accuracy. It is the reason the resume checker is deprioritised below
despite the engine already existing.

---

## The backlog

Status legend: **HAVE** = built and working · **PARTIAL** = engine exists, not
surfaced or incomplete · **NONE** = not built.

| # | Feature | Answers | Status | Cost |
|---|---------|---------|--------|------|
| 1 | Verified-live badge | ghost jobs | PARTIAL — validator runs, never shown | ~0 |
| 2 | Company responsiveness signal | silence | NONE | medium |
| 3 | What this company actually asks | moving-target prep | NONE | low |
| 4 | Dedupe by content fingerprint | duplicate listings | PARTIAL — JobID only | low |
| 5 | Take-home salary calculator | CTC confusion | NONE | ~0 to run |
| 6 | Posting age on every card | stale listings | **HAVE** — shipped | done |
| 7 | Where ex-colleagues went | career mapping | NONE | medium |
| 8 | Honest resume feedback | "roast my resume" | PARTIAL — scoring gated | low |
| 9 | Application status tracking | silence | NONE | employer-dependent |
| 10 | One-click apply | friction | **deliberate no** | conflicts with direct-apply |
| 11 | Company reviews | research | NONE | high — needs volume |

---

## Build order

### 1. Verified-live badge — *start here*

**Why first.** It answers the loudest complaint in the market, the engine is
already written and deployed, and no competitor can match it. Naukri and LinkedIn
structurally cannot: they take employer-submitted posts, so they have nothing to
verify against.

**What exists.** `tasks/runValidator.js` asks each ATS directly whether a posting
still exists — Greenhouse and Lever per job, Ashby/Personio/Recruitee per board,
Workday through its own endpoint. Three-state verdicts; ambiguity never expires a
job. Writes `livenessCheckedAt` on every live job.

**What is missing.** The field is not in the feed projection and nothing renders it.

**Scope.** Add `livenessCheckedAt` to `jobs-feed-projection.js`; render "Checked
4h ago" on the card and detail panel.

**First dry run, 400 jobs:** 0 dead, 397 live, 3 unknown, **138 wrongly expired
and restorable.**

### 2. Dedupe by content fingerprint

**Why.** Part of the ghost-job complaint is the same role appearing repeatedly.

**Current state.** Dedupe keys on `JobID` — catches one source scraped twice, not
the same role across two ATSs or near-identical titles from one company.

**Scope.** Fingerprint = company + normalised title + canonical city (reuse
`city-canonical.js`). Canonical copy chosen by source priority.

**Risk.** Over-merging genuinely distinct roles at one company. Needs a test suite
like `city-canonical.test.js`.

### 3. Take-home salary calculator

**Why.** The only feature here where JobMesh can be *measurably more accurate*
than every competitor, because it is arithmetic rather than inference. Competitor
calculators are US-centric (401k, state tax).

**Scope.** Old vs new regime side by side, EPF employee/employer split, gratuity,
professional tax by state, cess. One dated constants file, one pure calc module,
one page, no login.

**Must have.** Assessment year stamped on the page and in the constants file.
Without it the tool silently rots after a Budget and becomes worse than useless.

**Links to.** `/blog/india-tech-salary-ctc-vs-in-hand` and
`/blog/why-indian-tech-jobs-dont-show-salary`, which currently have nowhere to
send readers.

### 4. What this company actually asks

**Why.** Answers the moving-target quote directly, and no competitor can copy it —
it requires a corpus of real job descriptions.

**Scope.** Aggregate `autoTags` per company and per role/city. "Backend roles in
Bengaluru: Python 61%, Kubernetes 34%, Kafka 19%." Layer the 2026 interview shift
on top: system design, debugging existing code, judgment — not DSA.

**Reuses.** The existing `/tech-jobs` SEO page infrastructure.

### 5. Company responsiveness signal

**Why.** The silence problem. No board can make employers reply — but JobMesh can
publish what it *observes*.

**Scope.** From scrape history: how long this posting has been open, whether the
company reposts the same role repeatedly, how quickly its listings close. Churn
is already visible in `scrape_runs`.

**Caution.** Must be presented as observed behaviour, never as a prediction about
how a company treats candidates.

---

## Deliberately not building

**One-click apply.** ~50% of job seekers want it (iHire), and it contradicts
direct-apply, which is the actual differentiator. Every apply link goes to the
employer with no intermediary and no resume database.

**Resume checker as an AI score.** The engine exists and could be ungated cheaply,
but the request in the threads is "roast my resume" — a blunt human verdict, not
another score. Combined with the 20.9% too-many-AI-tools finding, this is low
priority despite being easy.

**Company reviews.** Needs review volume JobMesh does not have. Guides send people
to Glassdoor and will continue to.

---

## Current state, November 2026

- **Index:** 12,487 active jobs (was 8,572 before the location-filter fix widened capture)
- **Blog:** 10 posts live, all India-focused
- **Countries:** `TARGET_COUNTRIES=IN`. Nine more described and switched off in
  `core/target-countries.js`. Measured: enabling all ten would yield about 6.9x
  the jobs from already-configured companies.
- **Deployed:** `1f062e6`. Later commits pushed to `main` but **not deployed** on
  request.
