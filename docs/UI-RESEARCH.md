# JobMesh UI/UX research brief — September 2026

Research only. Nothing here has been built. This is the reference the next build
phase works from, so every rule below carries a number or a source, and every
recommendation is checked against what already exists in `apps/frontend`.

---

## 0. What we already have (so nothing gets duplicated)

| Thing | Where | State |
|---|---|---|
| Design tokens (monochrome "Functional Sanctuary", dark-first, amber→indigo thread) | `src/styles/theme-tokens.css`, `src/theme/tokens.ts` | Complete. Keep. |
| Motion tokens | `tokens.ts` → `MOTION.fast 120ms / normal 200ms / slow 320ms`, `ease cubic-bezier(0.2,0.8,0.2,1)`, `spring cubic-bezier(0.16,1,0.3,1)` | Good base. Missing: `--ease-out` strong curve, `--ease-drawer`, press timing. |
| Entrance keyframes (`fadeUp`, `scaleIn 0.97`, `shimmer`, `toastIn`, `sheetSlideUp`) + `.stagger` | `src/styles/primitives.css` | Exist. App pages deliberately do not animate in. Reduced-motion handled. |
| Card hover (`translateY(-2px)`, border-strong, shadow-md, 200ms) | `primitives.css .card.hover` | Exists. |
| Button primitive (variants, sizes, loading, icon slots) | `src/components/ui/Button.tsx` | **No `:active` press state, no hover lift** — `transition: all` (should be transform/opacity/color only). |
| UI kit: Modal, Drawer, Toast, Tooltip, Tabs, Stepper, Skeleton, Spinner, Switch, Checkbox… | `src/components/ui/` | Exists. Motion on each is basic keyframe (non-interruptible). |
| Landing hero R3F scene (globe, orbit cubes, gravity dust, Bloom+Vignette, `isLite` phone budget, pointer parallax, scroll pull-back) | `src/components/seeker/home/three/HeroScene.tsx` | Exists and already follows the "adaptive quality tier" pattern winners use. |
| GSAP + Lenis scroll choreography (words rise from clipped lines, nav hairline on scroll, bars scale from 0) | `ScrollMotion.tsx`, `home-motion.css` | Exists. |
| Fonts loaded | `app/layout.tsx`: Inter, Source Serif 4, JetBrains Mono, Instrument Serif, DM Sans | Five faces loaded. Inter is body — this is the #1 "AI-slop tell" (see §6). |
| Hero copy | `theme/copy-seeker-home.ts`: "Find your next / tech role in India", CTAs "Find roles" / "Hire talent" | Specific and honest. Weak on proof/outcome (see §7). |
| Installed libs | next 15.5, react 19, tailwind 4, gsap 3.15, lenis 1.3, three 0.185, @react-three/fiber 9.7, drei 10.7, @react-three/postprocessing 3.1, dnd-kit, recharts, lucide | Everything needed is installed. **Do not add Framer Motion/Motion** — GSAP already owns choreography; adding a second animation runtime would be the duplication the user warned about. |

Gaps, in one line: press feedback, interruptible transitions, origin-aware popovers,
View Transitions between routes, a distinctive display face, and copy that proves.

---

## 1. Awwwards — what wins in 2026 and what is transferable

Sources: [Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/), [Jeton SOTD](https://www.awwwards.com/sites/jeton), [Jeton case study](https://www.awwwards.com/case-study-jeton-by-burocratik.html), [Squarespace Foundations](https://www.awwwards.com/sites/squarespace-foundations), [United Carriers](https://www.awwwards.com/sites/united-carriers), [Illoca](https://www.awwwards.com/sites/illoca), [Trevor Noah](https://www.awwwards.com/sites/trevor-noah), [Immersive analysis](https://digitalstrategyforce.com/journal/why-are-immersive-experiences-dominating-the-2026-awwwards/), [Trends](https://reallygooddesigns.com/web-design-trends-2026/).

### Recent SOTD winners (Aug 28 – Sep 6, 2026)
United Carriers (Bearplus), Gionatan Nese '26, Illoca (Unseen Studio), Trevor Noah (OFF+BRAND), Paul Kalkbrenner (HOLOGRAPHIK), Squarespace Foundations (Resn), ERA Residence, Aardvark Book Club (FUTURE THREE), HOBRO DIGITAL, Decathlon Yestalgia (index).

### Scoring reality
Winners score ~7.3–7.6/10 overall. The jury weights **Design / Usability / Creativity / Content** equally; the dev award adds **Animations, Responsive, WPO, Semantics, Accessibility**. Jeton: animations 8.2, responsive 8.2, accessibility 7.4. United Carriers won with accessibility 6.8 — the jury tolerates it but every winner's weakest number is accessibility or WPO. **That is the gap a job platform can win on: same motion quality, better a11y and speed.**

### Patterns every winner shares
1. **Two-colour palettes.** Squarespace Foundations `#FFF/#292929`; United Carriers one electric blue `#0016CB`; Illoca `#3B60C5` on cream `#FDF2DE`; Trevor Noah `#FF9BB4` on navy `#1D2440`; Jeton `#F73B20`. One ground, one accent, used with restraint. Our monochrome + amber→indigo thread already fits this; the thread needs to be *the* accent moment, not a hairline nobody sees.
2. **3D is now table stakes, not a differentiator.** 61% of Q1-2026 SOTD winners are immersive 3D (23% in 2024); Three.js in 29/47. But *"WebGL shaders and bento grids are now commodity; distinctive voice, point of view and restraint are the real differentiators"* ([source](https://www.inspoai.io/blog/best-saas-website-designs-2026)). We have the 3D. Spend the next effort on voice and micro-craft.
3. **Scroll-driven narrative, not autoplay.** Master timeline normalized 0–1 to scroll; camera on a spline; ScrollTrigger decouples scroll from playback; uniform updates kept under ~4 ms/frame. Jeton: "minimal interaction required and without overwhelming autoplay animations". Video backgrounds now <8% of winners (was >40% in 2022).
4. **Adaptive quality tiers** by GPU: polygon count, texture res, particle density per device tier; functional HTML fallback. (We already do `isLite`.)
5. **Preloader as a moment**, then a "scroll to explore" affordance (United Carriers).
6. **Cursor-reactive reveals** (Illoca: reveal on mouse move, feature pull-out sequences, overlapping sections).
7. **The brand has a motif that is always in motion** (Jeton's disk). Ours could be the mesh/thread — one object that appears in the hero, the loader, the empty states, the 404, and the success moment, so the site reads as one thing.
8. **Cohesion between marketing and product**: "the website hero accurately reflects the app experience, eliminating any surprises" (Jeton lesson). The landing hero and the seeker dashboard should share the same components, not just the same colours.
9. **Type is the personality.** Typography-focused tag on most winners; custom or characterful display face, never default Inter.
10. **Tooling seen in the credits:** GSAP (+ SplitText, now free since 3.13), Lenis, Three.js/R3F, Rive for morphing sequences, Matter.js for playful physics; Webflow or Nuxt/Next; Vercel.

### Decathlon Yestalgia / Aardvark / ERA: layout trends worth noting
Scattered/floating modular grids that reward hover; layout animations where elements re-arrange (not just fade in); big header typography as the entry point.

---

## 2. Rightfit.so — the closest competitor, dissected

Sources: rightfit.so home (screenshot taken 2026-09-06), [How Rightfit works](https://www.rightfit.so/blog/how-we-works), [ERE spotlight](https://www.ere.net/articles/startup-spotlight-unlock-your-ats-with-rightfit).

**Positioning:** "Proof, not promises." Proof-of-work hiring for startups. Bengaluru, 2021, unfunded. Stats they show: 15k+ members, "median 5–10 days", "90%+ response rates", "hear back in days, not weeks".

**Copy on the marketing site:** headline "Rethinking Hiring"; sub "The proof of work hiring platform for startups."; "Get hired in startups based on proof of work, instead of relying on resumes."; CTAs "Get started" / "Hire with Rightfit"; sections "01 Find roles that fit you / 02 Hire people who ship / 03 Let your work speak"; "Trusted by teams worldwide, big and small, to hire better."

**The product UI (job board, `?job=` deep link):**
- Linear-style **three-column** app: 250px left rail (Discover / Activity / Preferences with tiny section eyebrows), a **job list** (role, company·location, type pill, posted, chevron) and a **detail pane** with an "Overview" key/value table (Location, Type, Level, Openings, Salary "Not disclosed", Posted) and "About the role".
- Pure `#0a0a0a`/`#111` dark, 1px hairlines, 13–14px text, pill badges coloured by job type (Full-time green, Internship purple).
- Top: **"75% Complete"** profile pill (Zeigarnik/endowed progress — always visible), tab bar "All Jobs 63 / Recommended Jobs 2 / Applied Jobs", Filter on the right, theme toggle.
- URL carries the selected job (`?job=uuid`) so a job is shareable and the pane state survives reload. **Steal this**: our job sheet should be URL-addressable too if it isn't.
- Weaknesses to beat: 30-second "Loading…" spinner in the detail header; company logos missing (grey squares) for most rows; no motion at all on row select; salary "Not disclosed" rendered as dead text rather than a nudge; no keyboard hints; mobile-hostile density.

**Takeaway for JobMesh:** Rightfit wins on *positioning clarity* (one sentence, one proof mechanic) and *app-like density*. It loses on craft (no press/hover states, loading feels slow) and on data completeness (logos). We should match the density and the profile-completeness pill, then out-craft it on every interaction and show real company logos.

---

## 3. Laws of UX — applied, not recited

Sources: [UX Design Institute — 21 laws](https://www.uxdesigninstitute.com/blog/laws-of-ux/), [Parallel — complete reference](https://www.parallelhq.com/blog/ux-laws-design-principles), [QUARTE 2026 guide](https://medium.com/@quartedesign/15-ui-ux-design-laws-with-examples-2026-guide-6927d0114204), [Monsoon Fish — Doherty](https://monsoonfish.com/cognilense/doherty-threshold/), [Userpilot — progress bar psychology](https://userpilot.com/blog/progress-bar-psychology/).

| Law | Rule | Concrete JobMesh application |
|---|---|---|
| **Hick's** | Decision time grows log(n) with options | Landing nav ≤ 5 items; hero has **one** primary CTA and one quiet secondary; filters progressively disclosed (3 top-level chips, rest in a sheet); no 14-item sidebars. |
| **Jakob's** | Users expect your site to work like the ones they already use | Job board = list + detail pane (Rightfit, LinkedIn, Wellfound all do this); apply button top-right of detail; `⌘K` command menu; Esc closes sheets; back button always works (View Transitions must not break history). |
| **Fitts's** | Time to target ∝ distance / size | Primary CTA ≥ 44px tall; sticky "Apply" on job detail on mobile (bottom edge = infinite target); row click area = whole row, not just the title; magnetic hover only on hero CTAs (it effectively enlarges the target). |
| **Doherty threshold** | Respond < 400 ms or attention drops | Every click gets feedback in < 100 ms (press scale, optimistic state) even if data takes longer; skeletons at 1–3 s, deterministic progress > 3 s, label at > 10 s; never freeze at 99%. |
| **Miller's** | ~7 chunks in working memory | Job cards show ≤ 5 facts; profile sections chunked; filter groups ≤ 5 options visible. |
| **Zeigarnik + Goal-gradient + Endowed progress** | Unfinished tasks nag; effort rises near the goal; pre-filled progress motivates | Profile-strength pill always visible (Rightfit "75% Complete"); start new users at ~20% after signup (endowed); fast-to-slow fill (Conrad: 11.3% vs 21.8% abandonment); "2 steps to a stronger profile" not "8 fields missing". |
| **Peak-End** | Memory = peak + ending | Design the *apply-submitted* moment (the peak) and the *session end* (a calm "3 applications sent, we'll email you" state) with the most care of anything in the product. |
| **Von Restorff** | The different thing is remembered | Exactly one element per view breaks the monochrome: the thread gradient on the primary action or the match score. Nothing else gets colour. |
| **Serial position** | First and last are remembered | Nav: Jobs first, Profile/Account last; job detail: title/company first, Apply last and sticky. |
| **Aesthetic-usability** | Pretty ⇒ perceived as more usable | Justifies polish spend on the seeker dashboard, not just the landing page. |
| **Tesler's** | Complexity is conserved | Don't hide salary filters or visa/notice-period fields; absorb complexity with smart defaults (location from IP, role from resume). |
| **Postel's** | Liberal in what you accept | Search accepts "SDE 2 bangalore remote"; resume upload accepts PDF/DOCX/LinkedIn URL; salary accepts "12 LPA" or "1200000". |
| **Proximity / Common region** | Near/bounded = related | Labels sit directly on inputs; filter chips share one bordered region; job meta (type · level · salary) in one row. |
| **Prägnanz** | Simplest interpretation wins | Match score is one ring, one number — not a radar chart. |
| **Parkinson's** | Work fills time available | Apply flow shows "≈ 40 seconds" and means it. |

---

## 4. Micro-interactions and the click — the exact numbers

Sources: [Emil Kowalski — 7 practical tips](https://emilkowal.ski/ui/7-practical-animation-tips), [Emil's animation STANDARDS](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md), [Rauno Freiberg — Invisible details](https://rauno.me/craft/interaction-design), [UIGuides micro-interactions](https://www.uxblueprints.com/guides/how-to-design-micro-interactions), [Art of Styleframe — when to animate](https://artofstyleframe.com/blog/micro-interactions-ui-when-to-animate/), [Createbytes 2026](https://createbytes.com/insights/microinteractions-ui-best-practices), [LogRocket ripple](https://blog.logrocket.com/designing-ripple-effect-ui-feedback/).

### The press (what happens when you click anything)
- `:active { transform: scale(0.97) }` — 0.96–0.98 range, **never below 0.95**. Transition ~120–160 ms `ease-out`. Release is *faster* than press ("slow where the user decides, fast where the system responds").
- For icon buttons and small chips use `scale(0.94)`; for full-width rows use a background tint instead of scale (a scaled 800px row looks wrong).
- Pair with a **1 px translateY** on hover-lift buttons so press = "down" and hover = "up".
- Gate hover: `@media (hover: hover) and (pointer: fine)`. Touch gets press only.
- **Ripple** (Material) is the wrong dialect for a monochrome Linear-style product; a press-scale + colour shift is the right one. Ripple only if we want the "warm/playful" register, which we don't.
- Frequency rule: an action done **100+ times/day gets no animation** (command menu, keyboard shortcuts, list navigation with arrows). Tens/day: reduce drastically. Occasional: standard. First-time/rare: delight (confetti on first application, first offer).
- **Never animate keyboard-initiated actions.**

### Durations (Emil / Saffer-model tables agree)
| Element | ms |
|---|---|
| Button press | 100–160 |
| Tooltip / popover | 125–200 (tooltips: first one delayed ~400 ms, subsequent siblings 0 ms) |
| Dropdown / select | 150–250 (180 feels better than 400) |
| Toggle | 200–300 |
| Modal / drawer / sheet | 200–500 |
| Toast | 200–300 in, ease-out; 400 out |
| Stagger between list items | 30–80 |
| Anything in UI | < 300 |

### Easing
```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);     /* enter, exit, press */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* move / morph */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* sheets, drawers */
```
Enter/exit → ease-out. Moving/morphing → ease-in-out. Hover colour → `ease`. Constant motion → linear. **Never `ease-in` on UI.** Springs (`duration 0.5, bounce 0.1–0.3`) only for drag/gesture; not for standard UI. Our current `MOTION.ease (0.2,0.8,0.2,1)` is fine for hover; add the three above.

### Physicality
- Never enter from `scale(0)`; start `scale(0.9–0.97) + opacity 0`.
- Popovers scale from the trigger (`transform-origin` from the anchor side). Modals stay centred.
- Add `filter: blur(2px)` during a cross-fade to hide the seam (< 20 px always).
- Use **transitions, not keyframes** for anything interruptible (toasts, sheets). Keyframes restart from zero; transitions reverse mid-flight. `@starting-style` gives entry animation with no JS.
- Only animate `transform` and `opacity`. Never `padding/margin/height/width/top/left`. Don't drive child transforms through CSS variables (recalcs the whole subtree).
- Momentum dismissal for sheets: velocity threshold ~0.11, not distance; over-drag with friction, not a hard stop.

### Rauno's principles that apply to us
- **Fidgetability**: interactive things reward idle manipulation (the match ring can be dragged/hovered, the 3D scene follows the pointer — already). 
- **Spatial consistency**: a job opens *from* its row (shared-element via View Transitions), the job sheet slides from where it came from.
- **Light actions trigger mid-gesture, destructive on completion**: swipe-to-dismiss a card reveals the action mid-swipe, commits on release; "Withdraw application" needs a full click + confirm.
- **Responsive feedback before the threshold**: on drag the card moves 1:1 immediately, then animates past the threshold.
- Screen edges are infinite targets — the mobile sticky Apply bar.

### Loading and waiting
- < 1 s nothing; 1–3 s skeleton (never spinner — skeletons are perceived faster and users are happier); > 3 s deterministic bar; > 10 s a label. Never park at 99%.
- Optimistic UI for save/apply/bookmark: flip the state instantly, reconcile later, shake + revert on failure.
- Numbers count up with `font-variant-numeric: tabular-nums` (or a fixed-width box) so the layout doesn't jitter.
- Route changes: **View Transitions API** (Next 15 / React 19.2 `<ViewTransition>` or `next-view-transitions`) — GPU cross-fade + shared-element morph (job card → job page title), no library, works with Lenis. Sources: [DEV guide](https://dev.to/krish_kakadiya_5f0eaf6342/mastering-smooth-page-transitions-with-the-view-transitions-api-in-2026-31of), [72Technologies](https://www.72technologies.com/blog/view-transitions-nextjs-app-router-guide).

### Feedback vocabulary (Saffer: trigger → rules → feedback → loops)
| Interaction | Feedback |
|---|---|
| Bookmark job | Icon fills + 1.15× overshoot spring, count ticks, toast "Saved" with Undo |
| Apply submitted | Button morphs to check (Family-style button→tray morph), confetti **only first time**, then a calm "Application sent · we'll email you" panel |
| Invalid form | 3-shake `translateX ±4px` 300 ms, field border → danger, message below, focus moves to field |
| Toggle | 200 ms slide + colour |
| Row select | 120 ms background tint, detail pane cross-fades 150 ms with 2 px blur |
| Drag reorder (pipeline) | lifted card scale 1.03 + shadow-lg, siblings slide with ease-in-out |
| Copy link | Icon → check 1.2 s, tooltip "Copied" |

### Sound (only if we opt in)
Opt-in, off by default, visible toggle, < 1 s, zero latency, only on meaningful outcomes (application sent, offer received) — never hover/scroll/click. Generate at runtime with Web Audio (e.g. `tiks`) rather than shipping mp3s. Sources: [Supadark](https://supadark.com/notes/5-best-practices-for-designing-web-sound-effects), [LogRocket useSound](https://blog.logrocket.com/rethinking-audio-feedback-usesound-hook/). Recommendation: skip for v1; revisit for the "application sent" peak.

### Accessibility
`prefers-reduced-motion: reduce` → keep comprehension aids (fades ≤ 200 ms), drop movement; never zero everything. Visible focus ring (we have `--focus-ring`). Animations must never block interaction (stagger is decorative).

---

## 5. The premium "Linear / Vercel / Raycast" register and how not to be a clone

Sources: [Studio Maydit](https://studiomaydit.com/blog/linear-vercel-raycast-aesthetic), [925 Studios — AI slop guide](https://www.925studios.co/blog/ai-slop-web-design-guide), [inspoai 2026 SaaS](https://www.inspoai.io/blog/best-saas-website-designs-2026), [toimi SaaS](https://toimi.pro/blog/best-saas-website-designs/).

What the register actually is: monochrome base + **one** accent used rarely; generous whitespace; **one idea per section**; real hover states; considered empty states; honest microcopy; "the confidence to leave things out is what reads as premium". Dark + gradient alone is surface copying.

The tells of generic/AI design (avoid all): Inter body + system fallback; purple→blue gradient; "Build the future of work"-style vague headlines; identical 16 px radius + 24 px padding on every card; same-height cards; emoji as section markers; everything centred; fade-in-on-scroll everywhere with no purposeful state change.

Fixes that matter most, in order: **typography** (the fastest escape — replace Inter with a face that carries personality; Linear modifies type, Vercel commissioned Geist, Stripe pairs bespoke serif + clean sans), copy in a real voice, real product screenshots/logos, purposeful micro-interactions on CTAs and forms, varied spacing and component sizing.

**Font direction to evaluate (not decided):** keep Instrument Serif as the editorial display voice (already loaded, already distinctive), move body from Inter to **Geist**, **Bricolage Grotesque**, or **Söhne-like** alternatives on Google Fonts (e.g. *Hanken Grotesk*, *Onest*, *Figtree*), and keep JetBrains Mono for data (salary, dates, counts). Whatever we pick, drop the unused of the five loaded faces — five families is its own kind of duplication.

---

## 6. Marketing words that convert — for a hiring product specifically

Sources: [GetResponse — 9 principles](https://www.getresponse.com/blog/copywriting-landing-page-conversions), [Landerlab — CTA phrases](https://landerlab.io/blog/50-powerful-call-to-action-phrases-that-convert), [Branded Agency](https://www.brandedagency.com/blog/high-converting-landing-pages), [Unbounce examples](https://unbounce.com/landing-page-examples/best-landing-page-examples/), [Cialdini's 7](https://www.cognitigence.com/blog/cialdini-7-principles-of-persuasion), [Motivational signals in job ads (research)](https://www.tandfonline.com/doi/full/10.1080/14719037.2023.2291068), [Employer trust signals (research)](https://link.springer.com/chapter/10.1007/978-3-658-33536-6_13).

### Principles
- 8/10 read the headline, 2/10 read on. Headline = **big promise or pain relief, ultra-specific**. Four U's: Unique, Useful, Ultra-specific, Urgent.
- Lead with outcomes not features; "What's in it for me" at every section.
- One primary CTA repeated ≥ 3 times (above fold, after benefits, end). Verb-first, specific, benefit-carrying: "Get My Free Guide" beats "Submit". Adding "free" lifts clicks. Remove friction words right beside the button ("No resume needed to browse", "Takes 40 seconds").
- Address the biggest objection in the copy (for seekers: *"is this spam / will anyone reply?"*; for employers: *"are these people real?"*).
- Trust > attention in hiring: a job search is "a series of trust-building moments". Social proof works only alongside other legitimacy signals (real logos, real numbers, real names) — scam research shows bare testimonials backfire.
- Scarcity framed as loss ("closes in 2 days", "3 openings") outperforms gain framing; in hiring, *skills* scarcity is the honest lever ("Only 4% of applicants get shortlisted — your profile is in the top 12%").

### Verb bank (hiring context)
Seeker: **Find · Get · Land · Apply · Match · Track · Hear back · Skip the line · See who's hiring · Start with your resume**
Employer: **Hire · Post · Shortlist · Reach · Fill · Meet · See candidates · Post a job free**
Trust modifiers: *verified · direct · no middlemen · updated daily · real · in days not weeks · free · no credit card*
Time/outcome modifiers: *today · in 40 seconds · this week · faster*

### What competitors say (so we don't say the same thing)
- Wellfound: "Where great companies meet great people." / "Find your next hire →" / "Sign up for free →" / 27,000+ startups, 10M+ candidates, "$0".
- Ashby: "What an ATS should be." / "Get in Touch" / 20+ logos, G2, SOC 2.
- Rightfit: "Proof, not promises." / "Get hired in startups based on proof of work" / "Hire with Rightfit" / 15k+, 5–10 days, 90%+ response.
- Linear (register reference): "The product development system for teams and agents" / "Get started".

### JobMesh's own line of attack (draft, to be written in the build phase)
Our current copy — "Find your next tech role in India. Fresh roles from top Indian tech companies, updated daily. Direct apply links, no middlemen." — is already specific and honest; it lacks *proof* and *outcome*. Direction: keep "India", "updated daily", "direct", add a real number (jobs indexed, companies, median time to hear back) and an objection killer next to each CTA. E.g. CTA pair "See today's roles" (secondary) + "Match me to roles →" (primary, free, 40 s). Employer: "Post a job free" + "See who applies".

---

## 7. Library and technique stack (all already installed unless noted)

Sources: [LogRocket 2026](https://blog.logrocket.com/best-react-animation-libraries/), [GSAP vs Motion](https://www.hontran.dev/blog/gsap-vs-framer-motion), [GSAP 3.13 free](https://gsap.com/blog/3-13/), [drei MeshTransmissionMaterial](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material), [Codrops efficient scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/), [n8ao](https://github.com/N8python/n8ao).

| Job | Tool | Notes |
|---|---|---|
| Scroll choreography, hero sequences, text splitting | **GSAP 3.15** (+ ScrollTrigger, **SplitText** — free since 3.13, full rewrite) | Already used. SplitText replaces our hand-rolled `.hm-line/.hm-word` if we want per-char. |
| Scroll feel | **Lenis** | Already used. |
| Component state motion (press, hover, popover, sheet) | **CSS transitions + `@starting-style` + WAAPI** | No new dep. Motion (Framer) is the alternative; declined to avoid two runtimes. |
| Route / shared-element transitions | **View Transitions API** via React 19 `<ViewTransition>` / `next-view-transitions` | Tiny; GPU; needs graceful no-op on Firefox. |
| 3D hero | **R3F 9 + drei 10 + postprocessing** | Already used. Options to *evaluate*, not add by default: drei `Float`, `MeshTransmissionMaterial` (glass thread; use low `samples`/`resolution` e.g. 32–64 on lite), `Environment` preset for reflections, `N8AO` only on desktop tier. Keep Bloom `resolutionScale 0.6`. Budget: < 4 ms/frame for uniform updates on scroll; DPR cap 1 on lite; instancing for dust. |
| Morphing device / illustration sequences | Rive (not installed) | Jeton used it; documentation gaps noted. Only if we want a morphing product illustration. Skip for now. |
| Playful physics (draggable chips) | Matter.js (not installed) | Only if a section calls for it. Skip for now. |
| Drag/reorder | dnd-kit | Already used for pipeline. |
| Command menu | `cmdk` (not installed) | Jakob's law: ⌘K is expected in this register; instant, no animation. Candidate. |
| Sound | Web Audio runtime synthesis (`tiks`) | Deferred. |

---

## 8. What a build plan would look like (for the next phase — not started)

1. **Motion foundation** (no visible redesign): add `--ease-out/--ease-in-out/--ease-drawer` + `--press` tokens; Button `:active scale(.97)`, transition on transform/color only, hover gate; convert Toast/Sheet/Drawer/Modal from keyframes to interruptible transitions with `@starting-style`; origin-aware Tooltip/Popover/ActionsMenu; input focus/error shake; optimistic bookmark. Every one of these touches an existing primitive, so nothing is duplicated.
2. **Perceived speed**: skeleton thresholds, deterministic progress for resume parsing, View Transitions between job list → job page with a shared title.
3. **Peak moments**: application-sent morph + first-time confetti; profile-strength pill with endowed progress; end-of-session summary.
4. **Type + copy pass**: one body face decision, drop unused fonts, rewrite hero/CTA/objection copy with real numbers, employer mirror.
5. **Landing polish**: one brand motif (the thread) reused in loader / empty / 404 / success; cursor-reactive reveal in one section only; SplitText hero; magnetic hover on the two hero CTAs only.
6. **Measure** against Awwwards' own rubric: design / usability / creativity / content + animations / responsive / WPO / a11y — and beat winners on the last two.
