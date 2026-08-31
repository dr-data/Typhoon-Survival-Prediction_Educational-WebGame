# Once in N Years — Product and Implementation Plan

An educational game for non-science university students on the **return period** (“once in N years”), based on the [Hong Kong Observatory educational article](https://www.hko.gov.hk/en/education/climate/climate-change/00672-Return-Period-Once-in-N-Years.html).

This document is the product spec, architecture, and roadmap that the code implements.

---

## 1. Game concept and learning objectives

**Concept.** Players are junior “harbour observers.” They do not forecast the weather. They learn how rare events are *named*. A 100-year rainstorm is not a booking on a calendar. It is a long-term average rate.

**Core claim (must remain visible throughout):** a return period \(T\) describes an average rate of occurrence. It does not mean the event occurs exactly once every \(T\) years.

**Learning objectives.** After one play session a student should be able to:

1. Translate annual probability \(p\) into return period \(T = 1/p\), and the reverse.
2. Reject the misconception that a 50-year event happens exactly once every 50 years.
3. State that a 100-year event can happen twice in 10 years (unlikely ≠ impossible).
4. Rank rarity: a 100-year event is rarer than a 10-year event because \(p = 1\%\) versus \(10\%\).
5. Compute \(P(\text{at least one in } n \text{ years}) = 1-(1-1/T)^n\), including the classic result that a 100-year event has only about a **63.4%** chance of appearing at least once in 100 years.
6. Read a random timeline: events cluster and leave long quiet gaps; different simulations with the same \(p\) look different.
7. Name the Observatory caveats: short records, choice of statistical method, geography, and climate change can all revise \(T\).

**Audience.** Non-science undergraduates (geography, social sciences, general education, disaster literacy). Language stays concrete. Formulas appear as one-liners, then as numbers in a story about rainfall, heat, or storm surge.

---

## 2. Recommended game loop

```
Home → Setup (nickname / anonymous ID, class code, Practice|Challenge)
     → 60-second briefing (four beats)
     → Question loop (calc → MCQ → graph → simulation, difficulty ramps)
     → Instant feedback (why, not only right/wrong)
     → Learning summary (strengths, gaps, formula recap)
     → Optional leaderboard post → Lab (free play) or new seed
```

**Session length:** Practice ~6–8 minutes (8 questions). Challenge ~10–14 minutes (14 questions). Lab is untimed.

**Classroom pattern:** 5-minute briefing on a projector, 8-minute Practice heat, 2-minute lab (“hit Run again”), optional Challenge as homework with a class code.

---

## 3. User interface and player experience

Visual language: night harbour / observatory desk. Deep navy, rain-cyan, amber highlights. Not a cartoon disaster, not a spreadsheet.

| Surface | Experience |
|---|---|
| Home | One question in the headline: *If a storm is “once in 100 years”, are you safe for 99 years?* Three facts: \(T=1/p\), 63.4%, clustering. |
| Setup | Practice vs Challenge. Anonymous ID on by default. Optional class/tutorial code. Nickname filter. No email. |
| Briefing | Four short beats matching the Observatory article. |
| Play | HUD with question index, points, streak. Calculation field accepts `5`, `5%`, `0.05`, `1/20`. MCQ keys `1–4`. Graph tiles are labelled SVG charts with text captions (colour is never the only cue). Simulation questions embed the lab. |
| Feedback | Correct / close / misconception. The wrong answer is treated as a known mix-up, then the average-vs-schedule idea is restated. |
| Lab | Slider for \(T\), 10/50/100 year buttons, new random history, count vs expected count, plain-language interpretation. |
| Summary | Score, concept meters, strengths, revisit list, climate/data caveat. |
| Leaderboard | Global or class-filtered. Anonymous IDs shown as such. |

Mobile: single column, 44px targets, horizontal table scroll. Keyboard: skip link, visible focus, radio/graph selection, number keys for MCQ. `prefers-reduced-motion` stops the rain animation.

---

## 4. Example questions

### Calculation

- Hourly rainfall above 100 mm has a 2% chance each year. Return period? **50 years.** \(T = 1/0.02\).
- A 20-year flood: annual probability? **5%** (`5`, `5%`, `0.05`, and `1/20` all match).
- 100-year event, 100 years, at least once? **63.4%.** \(1-0.99^{100}\).

### Multiple choice

- Does a 50-year event happen exactly once every 50 years? **No — average rate.**
- Annual probability of a 20-year event? Covered in calc; MCQ sister: 10-year vs 100-year rarity.
- Can a 100-year event happen twice in 10 years? **Yes, unlikely but allowed.**
- After last year’s 100-year storm, is this year safer? **No. Same \(p\) if years are independent.**
- Why did an Observatory-style fit jump from 50.0 to 34.1 years after one extra point? **Extremes are scarce; short records are sensitive.**
- Climate change? **If extremes become more frequent, \(T\) shortens.**

### Graphical choice

- Four 50-year timelines: metronome spacing (misconception), irregular ~\(n/T\) events (**correct**), almost every year, never.
- Probability bars: 10% vs 1% (**correct**), equal bars, reversed bars, both 100%.
- Rainfall bars with a 100 mm line: two exceedances ~18 years apart then a quiet spell (Observatory sketch), a spike on a fixed grid, always over the line, a deterministic climb.

---

## 5. Scoring, streak, difficulty, leaderboard

| Rule | Value |
|---|---|
| Base, correct | 100 |
| Time bonus | Up to +50, linear decay over 25 s |
| Streak | +10 / +20 / +30 at streaks 3 / 5 / 8 |
| Practice multiplier | ×1 |
| Challenge multiplier | ×1.5 |
| Partial numeric credit | 40% of base, streak broken |
| Incorrect | 0, streak reset |

**Leaderboard.** D1 table `runs`. Rank by score, then faster duration, then earlier submit. Filters: `class_code`, `difficulty`. Top 25. Nickname or anonymous `Storm-4821`-style ID. Blocklist + charset filter. No email, student number, or IP stored in `runs`.

**Anti-cheat (educational, not an exam):** server regenerates the quiz from `seed` and re-grades; client-claimed scores are ignored; submissions faster than 1.2 s per question are rejected; KV rate limit 90 req/min/IP; optional Turnstile on POST `/api/runs`.

---

## 6. Mathematical formulas and explanations

Teaching model: each year is an independent Bernoulli trial with success probability \(p\). This is the standard classroom model and matches the Observatory’s “average time separation” story. The game then *names* the ways reality is messier.

\[
T = \frac{1}{p} \qquad p = \frac{1}{T}
\]

\[
P(\text{at least one in } n \text{ years}) = 1-\left(1-\frac{1}{T}\right)^{n}
\]

\[
P(\text{none in } n \text{ years}) = \left(1-\frac{1}{T}\right)^{n}
\]

\[
\mathbb{E}[\text{count}] = \frac{n}{T}
\]

\[
P(\text{exactly } k) = \binom{n}{k} p^{k}(1-p)^{n-k}
\]

**Classic surprise.** \(T=100\), \(n=100\): \(P(\text{at least one}) \approx 63.4\%\), \(P(\text{none}) \approx 36.6\%\). Expected count is 1, but “exactly one” is not guaranteed.

**Empirical vs fitted (Observatory Figure 1).** Two exceedances in 50 years ⇒ naive \(T = 50/2 = 25\). A smoothed distribution fitted to the same fictitious series gave \(T = 50.0\). Method and scarce tails both matter.

**Independence vs climate.** Last year’s event does not spend a quota. A *changing* climate can still raise \(p\) and shorten \(T\) — that is a different mechanism, taught as its own card.

Implemented in `shared/math.ts`. Tests lock the 63.4% figure and invertibility of \(T \leftrightarrow p\).

---

## 7. Cloudflare architecture and data model

```
Browser (React SPA)
   │  static assets cached at the edge
   ▼
Worker (Hono)  ── run_worker_first: /api/*
   │
   ├─ D1  `once-in-n-years`   runs, events
   ├─ KV  RATE_LIMIT          per-IP sliding window
   ├─ Turnstile               optional, leaderboard POST
   ├─ Workers AI              optional hint rewrite; discarded unless required tokens survive
   └─ Analytics / observability  wrangler observability.enabled
```

**Why a Worker with static assets, not Pages + a second Worker.** One project, one deploy, API and SPA share origin, D1/KV bindings are local to the Worker. Pages remains a valid host if a course already uses it; the code does not depend on Pages-specific APIs.

**Durable Objects (phase 2).** A `LeaderboardRoom` per class code for live ranks during a tutorial. Not required for the MVP.

**Workers AI constraint.** Question text, numbers, and answer keys come only from `shared/questions/generate.ts`. AI may paraphrase a *validated* explanation and is dropped if it omits required tokens (formula fragments, the numeric answer). It never generates keys.

---

## 8. Recommended frontend and backend stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 + TypeScript + Vite | Fast local loop, accessible components, easy graph tiles |
| Worker | Hono on Cloudflare Workers | Tiny, typed, `/api/*` |
| Data | D1 (SQLite) | Relational leaderboard, class filters |
| Rate limit | KV | Cheap, good enough for class-sized traffic |
| Bots | Turnstile | No extra vendor |
| Tests | Vitest on `shared/` | Maths must not drift |
| Deploy | `@cloudflare/vite-plugin` + Wrangler | SPA + Worker as one unit |

No user accounts. No cookies beyond what Turnstile needs. No analytics PII.

---

## 9. API design and database schema

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + one-line lesson |
| GET | `/api/config` | Public Turnstile site key, whether AI hints are on |
| GET | `/api/quiz?difficulty&seed` | Public questions (no keys) |
| POST | `/api/runs` | Re-grade from seed, persist score |
| GET | `/api/leaderboard?classCode&difficulty` | Top 25 |
| POST | `/api/hint` | Optional AI paraphrase of a supplied, already-correct explanation |

`POST /api/runs` body:

```json
{
  "seed": 20260831,
  "difficulty": "challenge",
  "nickname": "",
  "anonymous": true,
  "classCode": "GEOG101",
  "answers": [{ "questionId": "tfp-…", "value": 50, "elapsedMs": 8200 }],
  "turnstileToken": "…"
}
```

### Schema

See `migrations/0001_init.sql`:

- `runs(id, nickname, anonymous, class_code, difficulty, seed, score, correct, question_count, best_streak, duration_ms, created_at)`
- `events(id, run_id, kind, created_at)` for coarse usage counts (no IP)

---

## 10. Security, privacy, accessibility, anti-cheating

**Privacy.** Nickname or generated ID only. Class code is an optional shared classroom token, not a student identifier. Do not log IP into D1. Turnstile uses IP only at verify time.

**Security.** Parameterised D1 statements. JSON size is small. Secrets via `wrangler secret put` (`TURNSTILE_SECRET`). CSP can be added in phase 2 via Worker headers on HTML.

**Accessibility.** Skip link, one `h1` per view, SVG `aria-label`s, visible focus, 44px targets, not red/green-only (teal/amber/coral + text + icons), reduced motion, keyboard MCQ.

**Anti-cheat.** Server-side grade from seed; min duration; rate limit; Turnstile; nickname blocklist. This is a teaching game, not a high-stakes exam. Keys currently ship in the client bundle so classroom wifi can still play; Challenge scores still re-grade on the Worker. Phase 2 can serve keys server-only.

---

## 11. Phased development roadmap

**Phase 0 — MVP (this repository).** Shared maths, question templates, Practice/Challenge, graphs, lab, summary, D1 leaderboard, KV rate limit, tests, local Vite + Wrangler.

**Phase 1 — Classroom hardening.** Real D1/KV ids, Turnstile keys, Web Analytics, class-code teacher sheet, bilingual EN/ZH copy, print-friendly formula card.

**Phase 2 — Live tutorial.** Durable Object per class code, optional Workers AI hints with token gate, teacher dashboard (counts only), more hazard skins.

**Phase 3 — Topic kits.** Reuse `PublicQuestion` / `AnswerKey` for related GE topics (risk, expected value, independence) without rewriting the shell.

---

## 12. Folder structure

```
docs/PRODUCT.md          ← this file
README.md                ← run / deploy
wrangler.jsonc
vite.config.ts
vitest.config.ts
migrations/0001_init.sql
shared/
  math.ts                ← formulas, RNG, simulation
  scoring.ts
  nicknames.ts
  questions/
    types.ts
    kit.ts / mcq.ts / visuals.ts
    generate.ts          ← orchestrates factories; only source of answer keys
    grade.ts
worker/
  index.ts               ← Hono API
  rateLimit.ts
  turnstile.ts
  hints.ts
src/
  App.tsx                ← shell
  views/                 ← home, setup, briefing, play, lab, summary, board
  components/            ← charts, simulator, harbour scene
tests/                   ← Vitest
public/favicon.svg
```

---

## 13. Starter code and important components

Already implemented:

- `shared/math.ts` — \(T\leftrightarrow p\), at-least-once, binomial, seeded simulation, student number parsing (`5%`, `1/20`).
- `shared/questions/generate.ts` — template factories; seeds make quizzes reproducible.
- `shared/questions/grade.ts` — single grader used by client summary and Worker.
- `worker/index.ts` — health, quiz, runs, leaderboard, hint.
- `src/components/Simulator.tsx` and `Charts.tsx` — the graphical language of the game.
- `src/App.tsx` — loop, a11y, scoring HUD, summary.

Local:

```bash
npm install
npm test
npm run db:migrate:local
npm run dev
```

Deploy (after `wrangler login` and real D1/KV ids):

```bash
npx wrangler d1 create once-in-n-years
npx wrangler kv namespace create RATE_LIMIT
# paste ids into wrangler.jsonc
npm run db:migrate:remote
npm run deploy
```

---

## 14. Testing strategy

| Layer | What | How |
|---|---|---|
| Mathematical correctness | \(T=1/p\), 63.4%, invertibility, empirical 2/50=25, RNG reproducibility | `npm test` (`tests/math.test.ts`) |
| Gameplay / keys | Quiz length, type mix, perfect run, garbage answers score 0 | `tests/questions.test.ts` |
| Scoring | Time, streak tiers, challenge ×1.5, partial credit | `tests/scoring.test.ts` |
| Privacy / nicknames | Blocklist, anonymous IDs, class-code charset | `tests/nicknames.test.ts` |
| API | Health, reject fast runs, leaderboard filter | `vite preview` + curl (manual in MVP; Workers vitest pool in phase 1) |
| Accessibility | Keyboard path, labels, contrast, reduced motion | Browser pass on home → setup → one calc, one MCQ, one graph, lab |
| Performance | Shared math is O(n) per sim; SVG bars for n≤100 | Keep simulations at 10/50/100 years |
| Security | Parameterised SQL, rate limit, Turnstile skip in local | Code review + optional `wrangler tail` |

**AI rule for tests:** never snapshot an LLM string as an answer key. Keys are numbers and choice ids from templates.

---

## Design goals checklist

- Visually calm, harbour-night, not noisy
- Mobile-friendly and keyboard-usable
- Understandable in the first minute (home headline)
- Classroom / self-study / short contest
- One Worker, no extra origin
- Question types are factories — add a topic by adding a function
- Colour-blind safe charts (labels + position, not hue alone)
- No unnecessary personal data
