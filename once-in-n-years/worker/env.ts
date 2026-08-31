export interface Env {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  AI?: Ai;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
}
