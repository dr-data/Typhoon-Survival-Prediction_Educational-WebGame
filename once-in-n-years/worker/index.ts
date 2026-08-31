import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildQuiz, publicQuiz } from "../shared/questions/generate";
import { gradeRun } from "../shared/questions/grade";
import { minimumHonestDurationMs } from "../shared/scoring";
import { normaliseClassCode, sanitiseNickname } from "../shared/nicknames";
import type { Difficulty } from "../shared/scoring";
import type { StudentAnswer } from "../shared/questions/types";
import type { Env } from "./env";
import { maybeRewriteExplanation } from "./hints";
import { rateLimit } from "./rateLimit";
import { verifyTurnstile } from "./turnstile";

type Bindings = Env;

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

app.use("/api/*", async (c, next) => {
  if (c.env.RATE_LIMIT) {
    const ip = c.req.header("CF-Connecting-IP") ?? "local";
    const limited = await rateLimit(c.env.RATE_LIMIT, ip, 90, 60);
    if (!limited.ok) {
      return c.json({ error: "Too many requests. Take a breath and try again in a minute." }, 429);
    }
  }
  await next();
});

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    name: "once-in-n-years",
    lesson: "A return period is a long-term average, not a timetable.",
  }),
);

app.get("/api/config", (c) =>
  c.json({
    turnstileSiteKey: c.env.TURNSTILE_SITE_KEY ?? "",
    aiHints: Boolean(c.env.AI),
  }),
);

app.get("/api/quiz", (c) => {
  const difficulty = parseDifficulty(c.req.query("difficulty"));
  const seed = Number(c.req.query("seed") ?? Date.now());
  if (!Number.isFinite(seed)) {
    return c.json({ error: "Invalid seed" }, 400);
  }
  const quiz = publicQuiz(buildQuiz(Math.abs(Math.floor(seed)), difficulty));
  return c.json(quiz);
});

app.post("/api/runs", async (c) => {
  let body: {
    seed?: number;
    difficulty?: Difficulty;
    nickname?: string;
    anonymous?: boolean;
    classCode?: string;
    answers?: StudentAnswer[];
    turnstileToken?: string;
    rewriteHint?: boolean;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Send JSON." }, 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "local";
  const human = await verifyTurnstile(c.env, body.turnstileToken, ip);
  if (!human) {
    return c.json({ error: "Please complete the bot check before posting a score." }, 400);
  }

  const difficulty = parseDifficulty(body.difficulty);
  const seed = Number(body.seed);
  if (!Number.isFinite(seed)) {
    return c.json({ error: "Missing seed." }, 400);
  }
  const nick = sanitiseNickname(body.nickname ?? "", Boolean(body.anonymous));
  if (!nick.ok) {
    return c.json({ error: nick.error }, 400);
  }
  let classCode: string | null = null;
  try {
    classCode = normaliseClassCode(body.classCode);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Invalid class code" }, 400);
  }

  const answers = Array.isArray(body.answers) ? body.answers : [];
  const report = gradeRun(Math.abs(Math.floor(seed)), difficulty, answers);
  if (report.durationMs < minimumHonestDurationMs(report.items.length)) {
    return c.json({ error: "That run was too fast to submit. Play it through, then post." }, 400);
  }

  if (!c.env.DB) {
    return c.json({ error: "Leaderboard is not bound in this preview." }, 503);
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO runs (id, nickname, anonymous, class_code, difficulty, seed, score, correct, question_count, best_streak, duration_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      nick.nickname,
      nick.anonymous ? 1 : 0,
      classCode,
      difficulty,
      Math.abs(Math.floor(seed)),
      report.totalPoints,
      report.correct,
      report.items.length,
      report.bestStreak,
      report.durationMs,
      createdAt,
    )
    .run();

  await c.env.DB.prepare(
    `INSERT INTO events (run_id, kind, created_at) VALUES (?, ?, ?)`,
  )
    .bind(id, "run_submitted", createdAt)
    .run();

  return c.json({
    id,
    nickname: nick.nickname,
    score: report.totalPoints,
    report: {
      ...report,
      items: report.items.map((item) => ({
        questionId: item.question.id,
        kind: item.kind,
        points: item.grade.points,
        explanation: item.explanation,
        misconception: item.misconception,
        expected: item.expected,
        concept: item.question.concept,
      })),
    },
  });
});

app.get("/api/leaderboard", async (c) => {
  if (!c.env.DB) {
    return c.json({ classCode: null, entries: [], preview: true });
  }
  const difficulty = c.req.query("difficulty");
  const classCodeRaw = c.req.query("classCode");
  let classCode: string | null = null;
  try {
    classCode = normaliseClassCode(classCodeRaw);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Invalid class code" }, 400);
  }

  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (difficulty === "practice" || difficulty === "challenge") {
    clauses.push("difficulty = ?");
    params.push(difficulty);
  }
  if (classCode) {
    clauses.push("class_code = ?");
    params.push(classCode);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await c.env.DB.prepare(
    `SELECT nickname, anonymous, class_code, difficulty, score, correct, question_count, best_streak, duration_ms, created_at
     FROM runs ${where}
     ORDER BY score DESC, duration_ms ASC, created_at ASC
     LIMIT 25`,
  )
    .bind(...params)
    .all<{
      nickname: string;
      anonymous: number;
      class_code: string | null;
      difficulty: string;
      score: number;
      correct: number;
      question_count: number;
      best_streak: number;
      duration_ms: number;
      created_at: number;
    }>();

  return c.json({
    classCode,
    entries: (rows.results ?? []).map((row, index) => ({
      rank: index + 1,
      nickname: row.nickname,
      anonymous: Boolean(row.anonymous),
      classCode: row.class_code,
      difficulty: row.difficulty,
      score: row.score,
      correct: row.correct,
      questionCount: row.question_count,
      bestStreak: row.best_streak,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    })),
  });
});

app.post("/api/hint", async (c) => {
  let body: { explanation?: string; requiredTokens?: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Send JSON." }, 400);
  }
  const explanation = (body.explanation ?? "").slice(0, 1200);
  const tokens = Array.isArray(body.requiredTokens) ? body.requiredTokens.slice(0, 8) : [];
  if (explanation.length < 20) {
    return c.json({ error: "Nothing to rewrite." }, 400);
  }
  const rewritten = await maybeRewriteExplanation(c.env, explanation, tokens);
  return c.json(rewritten);
});

function parseDifficulty(value: string | undefined): Difficulty {
  return value === "challenge" ? "challenge" : "practice";
}

export default app;
