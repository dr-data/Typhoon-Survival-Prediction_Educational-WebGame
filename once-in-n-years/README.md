# Once in N Years

Browser game that teaches the **return period** — the statistical meaning of “once in N years” — using the Hong Kong Observatory’s educational explanation.

A return period \(T\) is a **long-term average**, not a promise that the event happens exactly once every \(T\) years.

**Full product and implementation plan:** [docs/PRODUCT.md](./docs/PRODUCT.md)

## Play locally

Requires Node 22+. Run these from the repository root.

```bash
npm install
npm test
npm run db:migrate:local
npm run dev
```

`npm run dev` does **not** require a Cloudflare account. Workers AI is not bound, so Vite will not open a login window. To enable paraphrased hints later, add `"ai": { "binding": "AI" }` to `wrangler.jsonc` after `npx wrangler login`.

Open the URL Vite prints (usually `http://localhost:5173`).

- **Morning watch (Practice)** — 8 tap-the-answer calls, optional formula, ~6 minutes
- **Typhoon watch (Challenge)** — 14 calls, climate plot twists, 1.5× score
- **Weather dice** — slider for \(T\), 10 / 50 / 100 year runs, reroll
- **Honour board** — nickname or anonymous storm ID, optional class code

## Deploy on Cloudflare

D1 (`once-in-n-years`) and KV (`ONCE_IN_N_YEARS_RATE_LIMIT`) are already created for this account. IDs live in `wrangler.jsonc`.

```bash
npx wrangler login
npm run db:migrate:remote
npm run deploy
```

GitHub Actions can deploy on every push to `main` once you add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (Workers edit permission). Then use **Actions → Deploy to Cloudflare Workers → Run workflow**.

Optional secrets:

```bash
npx wrangler secret put TURNSTILE_SECRET
```

Set `TURNSTILE_SITE_KEY` in `wrangler.jsonc` `vars` (public). Leave both empty to skip bot checks in class demos.

Workers AI is not bound. Hints always use the validated template unless you later add an `AI` binding in `wrangler.jsonc`. Even then, paraphrases are discarded if they omit required formula tokens or numbers.

## What is generated where

| Thing | Source |
|---|---|
| Formulas and simulations | `shared/math.ts` |
| Question wording and **answer keys** | `shared/questions/` factories, assembled in `generate.ts` |
| Score | `shared/scoring.ts`, re-run on the Worker |
| AI | Optional paraphrase of an existing explanation; never writes keys |

## Tests

```bash
npm test
```

These lock \(T = 1/p\), the 63.4% “100-year event in 100 years” figure, scoring, nicknames, and quiz generation.

## Source

[Hong Kong Observatory: Return Period — “Once in N Years”?](https://www.hko.gov.hk/en/education/climate/climate-change/00672-Return-Period-Once-in-N-Years.html)
