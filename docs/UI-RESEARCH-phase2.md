# Phase 2 brief — Today · Directory · Profile · Resume · (retire Progress)

Research only, 2026-09-06. Companion to `UI-RESEARCH.md` §1–8 (which still applies:
Hick's/Jakob's, the press/duration numbers, copy rules). `/login` and `/jobs` are done and
frozen. Everything below is checked against the code that exists so the build edits files
instead of adding parallel ones.

## 0. What exists today (do not duplicate)

| Page | Composition | Keep / change |
|---|---|---|
| `/today` | `SeekerWorkspace` frame (280px glass sidebar: avatar, 3 mono stats, section nav Today/Progress/Resume/Profile) → `today/Hero` (greeting, goal ring) + `PicksSection` (4 skill-matched jobs) + `NewsSection` | Frame stays. Hero copy, the picks (reuse `JobListItem` rows — the same row as `/jobs`), and the stats move here from Progress. |
| `/progress` | `Progress.tsx`: ProgressRing + 3 Stats, `ActivityChart` (7 days), `HeatmapCalendar`, `FunnelChart`, `PipelineView` (grouped by company, stage select) | **Retire the route.** Its content is the second half of Today (§2). Redirect `/progress → /today#pipeline`. Remove from `SeekerAppShell` nav, `SeekerWorkspace.SECTIONS`, `TopNav` quick-stat link, `UserMenu` "My progress". |
| `/directory` | `CompanyDirectory` (search, sort dropdown, 24/page `DirectoryCard` glass cards, `Pagination`) | Structure fine. Redesign the card and the header type; industry chips; hover reveals open roles. |
| `/profile` | `Profile.tsx` stacks 11 `Card`s: SettingsCard (slug/share/visibility) → ReviewCard (score) → MarketCard → Contact → Skills → LeetCodeConnect → GitHubConnect → Preferences → Experience → Education → Certifications | **Full re-layout** (§3). Every sub-component is reusable as-is; only `Profile.tsx` plus a new two-column frame change. |
| `/resume` | `ResumeUpload` state machine: ConsentGate → `ResumeUploadZone` → `ResumeParsingScreen` (polling) → routes to `/profile` | Keep the machine. Redesign the three screens (§4). |
| Fonts | Instrument Serif (display), Inter (body), JetBrains Mono (data) | Page titles on these pages become the serif display at one scale — `clamp(28px, 3vw, 40px)`, letter-spacing `-0.03em`, weight 400 — the same voice as the `/jobs` detail title. That is the "title font" fix asked for. |

## 1. Rightfit `/profile` — what we know, what is blocked

The page needs a session. This session's automation tab is not permitted on rightfit.so
and `WebFetch` hits the login wall. From their marketing pages and the app shell seen
earlier ([how it works](https://www.rightfit.so/blog/how-we-works),
[hire](https://www.rightfit.so/hire),
[ERE](https://www.ere.net/articles/startup-spotlight-unlock-your-ats-with-rightfit)):

- Left rail: **Discover → Job Board**, **Activity → Your Profile**, **Preferences → Job Preferences**.
- Top bar: a permanent **"75% Complete"** pill (Zeigarnik / endowed progress).
- Profile = **proof-of-work items** (projects, repos, designs, case studies), **verified
  skills**, and stats — example figures on their site: **8 Projects · 16 Skills · 5 Roles**,
  monthly **profile views**, **27 replies · 4 interviews · 12 interested teams**.
- Positioning line: "one place to show real work, track every application, and get found by
  teams that want proof, not paper."

To mirror their exact layout: allow `rightfit.so` for the Claude Chrome extension (side
panel → site permissions) or paste a screenshot. The build can start without it — the
pattern (rail · completeness · proof items · stats) is clear and matches Peerlist/Read.cv.

## 2. Today (absorbs Progress)

Sources: [Smashing — streak UX](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/),
[Huntr vs Teal vs Careerflow](https://www.careerflow.ai/blog/huntr-vs-teal-vs-careerflow),
[Userpilot — progress bar psychology](https://userpilot.com/blog/progress-bar-psychology/).

- **One page, two halves.** Top = *today*: greeting, goal ring, streak, the 4 picks as
  `JobListItem` rows with one-click "Mark applied". Bottom = *your search*: 7-day chart,
  funnel, pipeline. Huntr and Teal both put "how many at which stage" **above** the list —
  do the same with a stage strip (Applied · Interview · Offer · Closed) as chips that filter
  the pipeline.
- **Streak rules** (Smashing): the daily action must be tiny (one application, even one
  save); show "streak at risk" gently; **never hard-reset** — decay or a one-day grace;
  celebrate 7 / 30 / 100 with first-time confetti only (Peak-End). Duolingo's streak widget
  raised commitment 60%; a badge alone +6% DAU — the TopNav "1 today · 1d streak" pill is
  already that widget; keep it and point it at `/today`.
- **Goal-gradient:** the ring fills fast-to-slow (first application = ~50% of the arc when
  the goal is 2). Conrad: fast-to-slow 11.3% abandonment vs 21.8% slow-to-fast.
- Copy: "Good evening, Piyush. One more and today is done." beats "Daily goal: 1/2".

## 3. Profile — Rightfit / Peerlist / Read.cv synthesis

Sources: [Eleken — 20 profile pages](https://www.eleken.co/blog-posts/profile-page-design),
[UXPin — profile UI](https://www.uxpin.com/studio/blog/profile-page-ui-design/),
[Read.cv toolkit](https://www.hackdesign.org/toolkit/read-cv/),
[Peerlist portfolio](https://dev.to/sadanandpai/peerlist-a-simple-but-powerful-portfolio-2jmm),
[Halo Lab](https://www.halo-lab.com/blog/profile-page-design),
[Muzli 2026 profiles](https://muz.li/inspiration/profile-page/).

- **Layout: GitHub-style split.** Left column (sticky, ~300px): identity card — avatar,
  name, headline, location, **profile-strength ring + the next two actions** ("Add 3 more
  skills", "Connect GitHub"), share link, visibility. Right column, the *record*, in this
  order: **Proof** (GitHub repos + heatmap, LeetCode) → **Skills** (with market match) →
  **Experience** (Read.cv timeline: mono dates left, role/company right) → **Education /
  Certifications** → **Preferences** (role, cities, salary, notice). Settings (slug,
  visibility, danger zone) go **last or behind a tab** — Eleken: identity first, most-used
  content second, destructive actions at the bottom.
- **Editing:** block-by-block (the Upwork pattern) — each section has one quiet "Edit" that
  turns that block into a form in place; no global edit mode.
- **Completeness:** endowed progress (start ≥ 20%), fast-to-slow, the pill visible in the
  TopNav like Rightfit's "75% Complete"; the *next action* is always named, never "8 fields
  missing".
- **Proof over claims** (Peerlist's authenticity lesson): verified integrations (GitHub,
  LeetCode) render as *evidence cards* directly under the identity, above self-declared
  skills. A skill that also appears in a repo gets a small check.
- **Type:** name in Instrument Serif 40px; section labels mono uppercase with a hairline
  (reuse `.jb-section__label`); body Inter 14.5. Reuse `.jb-kv` for Preferences and
  Contact — the same key/value table as the job Overview.
- **Empty states** prompt one action each: "No repos yet — Connect GitHub", with the connect
  button *inside* the block.

## 4. Resume

Sources: [Rezi score](https://www.rezi.ai/rezi-docs/the-rezi-score-explained),
[Resume Worded](https://resumeworded.com/), [Jobscan](https://www.jobscan.co/resume-scanner),
[ATS format advice](https://blog.uxfol.io/ux-resume-what-to-include/).

- Three screens, one frame. **Upload:** the drop zone is the hero (PDF/DOCX); ConsentGate
  copy cut to one line plus a "what we store" disclosure. **Parsing:** a deterministic-feeling
  bar — "Reading · Extracting skills · Matching roles" — fast-to-slow, never parked at 99%,
  a label after 10s. **Result:** the Rezi model — a 0–100 ring, **five sub-scores**
  (Content / Format / Keywords / Best practices / Ready), each a row with one fix and a
  green check once fixed; "Open profile" is the single CTA.
- ATS honesty: tell the seeker when their PDF is two-column or graphic (it breaks parsers) —
  a real, useful objection-killer.
- `ProfileReviewCard` on `/profile` already computes a score: reuse it as the Result ring
  rather than building a second scorer.

## 5. Directory

Sources: [Welcome to the Jungle companies](https://app.welcometothejungle.com/companies),
[Subframe — job-board examples](https://www.subframe.com/tips/job-board-website-design-examples), Wellfound.

- Card = logo tile 44 · name (sans 15/600 — the *page title* is the serif) · industry ·
  **open roles as the big mono number** · cities · a thin "hiring this week" indicator.
  Hover lifts (existing `.jb-link-card`) and reveals the top two role titles (WTTJ's
  preview-on-hover pattern).
- Header: serif title + count in `tabular-nums`; sort chip + industry chips (Hick's: ≤ 5
  visible, rest in More — reuse the `/jobs` More popover).
- Grid `auto-fill minmax(260px, 1fr)`; cards enter with `.rise` stagger; pagination becomes
  "Load more" like `/jobs`.

## 6. Motion & copy rules carried over (already built — reuse, never re-create)

`.press` / `.ui-btn` press · `.rise` stagger · `.jb-swap` crossfade · `.jb-pop` · `.shake` ·
`.jb-kv` · `.jb-section__label` · `.jd-prose` · `.jb-row` · the More popover ·
`FilterPanel` (open scale, chevron turn, picked flash, smooth scroll with fade edges).
No Framer Motion. Copy: verb-first, outcome-led, one CTA per block, real numbers.

## 7. Build order (when told to go)

1. Retire `/progress` (redirect + nav cleanup) and move its four widgets into Today.
2. Today: hero + picks as rows + stage strip.
3. Profile: split layout, block editing, strength ring.
4. Resume: three screens + Rezi-style result.
5. Directory: card + header.

Each step: screenshot dark + light, typecheck, lint, tests.
