# Once in N Years

Browser game that teaches the **return period** — the statistical meaning of “once in N years” — using the Hong Kong Observatory’s educational explanation.

A return period \(T\) is a **long-term average**, not a promise that the event happens exactly once every \(T\) years.

**Full product and implementation plan:** [docs/PRODUCT.md](./docs/PRODUCT.md)

## Play locally

Requires Node 22+.

```bash
cd once-in-n-years
npm install
npm test
npm run db:migrate:local
npm run dev
```

`npm run dev` does **not** require a Cloudflare account. Workers AI is off by default so Vite will not open a login window. To enable paraphrased hints later, add `"ai": { "binding": "AI" }` to `wrangler.jsonc` after `npx wrangler login`.

Open the URL Vite prints (usually `http://localhost:5173`).

- **Practice** — 8 questions, formula hints, ×1 scoring
- **Challenge** — 14 questions, multi-year probability, climate/data caveats, ×1.5
- **Lab** — slider for \(T\), 10 / 50 / 100 year runs, new random histories
- **Leaderboard** — nickname or anonymous ID, optional class code

## Deploy on Cloudflare

1. `npx wrangler login`
2. Create D1 and KV, then replace the placeholder ids in `wrangler.jsonc`:

```bash
npx wrangler d1 create once-in-n-years
npx wrangler kv namespace create RATE_LIMIT
```

3. Apply migrations and deploy:

```bash
npm run db:migrate:remote
npm run deploy
```

Optional secrets:

```bash
npx wrangler secret put TURNSTILE_SECRET
```

Set `TURNSTILE_SITE_KEY` in `wrangler.jsonc` `vars` (public). Leave both empty to skip bot checks in class demos.

Workers AI is bound as `AI`. Hints still fall back to the validated template if the model is missing or invents numbers.

## What is generated where

| Thing | Source |
|---|---|
| Formulas and simulations | `shared/math.ts` |
| Question wording and **answer keys** | `shared/questions/generate.ts` only |
| Score | `shared/scoring.ts`, re-run on the Worker |
| AI | May paraphrase an existing explanation; never writes keys |

## Tests

```bash
npm test
```

These lock \(T = 1/p\), the 63.4% “100-year event in 100 years” figure, scoring, nicknames, and quiz generation.

## Source

[Hong Kong Observatory: Return Period — “Once in N Years”?](https://www.hko.gov.hk/en/education/climate/climate-change/00672-Return-Period-Once-in-N-Years.html)
