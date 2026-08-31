export type Difficulty = "practice" | "challenge";

export const BASE_POINTS = 100;
export const MAX_TIME_BONUS = 50;
export const TIME_WINDOW_MS = 25_000;
export const PRACTICE_MULTIPLIER = 1;
export const CHALLENGE_MULTIPLIER = 1.5;
export const PARTIAL_CREDIT_FRACTION = 0.4;

export type GradeKind = "correct" | "partial" | "incorrect";

export type GradeResult = {
  kind: GradeKind;
  points: number;
  streak: number;
  bestStreak: number;
  timeBonus: number;
  streakBonus: number;
  multiplier: number;
};

export function difficultyMultiplier(difficulty: Difficulty): number {
  return difficulty === "challenge" ? CHALLENGE_MULTIPLIER : PRACTICE_MULTIPLIER;
}

export function timeBonus(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
  const capped = Math.min(elapsedMs, TIME_WINDOW_MS);
  return Math.max(0, Math.round(MAX_TIME_BONUS * (1 - capped / TIME_WINDOW_MS)));
}

export function streakBonus(streakAfterCorrect: number): number {
  if (streakAfterCorrect >= 8) return 30;
  if (streakAfterCorrect >= 5) return 20;
  if (streakAfterCorrect >= 3) return 10;
  return 0;
}

export function gradeAnswer(input: {
  kind: GradeKind;
  elapsedMs: number;
  previousStreak: number;
  previousBestStreak: number;
  difficulty: Difficulty;
}): GradeResult {
  const multiplier = difficultyMultiplier(input.difficulty);
  if (input.kind === "incorrect") {
    return {
      kind: "incorrect",
      points: 0,
      streak: 0,
      bestStreak: input.previousBestStreak,
      timeBonus: 0,
      streakBonus: 0,
      multiplier,
    };
  }

  const nextStreak =
    input.kind === "correct" ? input.previousStreak + 1 : 0;
  const bonusTime = input.kind === "correct" ? timeBonus(input.elapsedMs) : 0;
  const bonusStreak = input.kind === "correct" ? streakBonus(nextStreak) : 0;
  const raw =
    input.kind === "correct"
      ? BASE_POINTS + bonusTime + bonusStreak
      : Math.round(BASE_POINTS * PARTIAL_CREDIT_FRACTION);
  const points = Math.round(raw * multiplier);
  const bestStreak = Math.max(input.previousBestStreak, nextStreak);

  return {
    kind: input.kind,
    points,
    streak: nextStreak,
    bestStreak,
    timeBonus: bonusTime,
    streakBonus: bonusStreak,
    multiplier,
  };
}

export function minimumHonestDurationMs(questionCount: number): number {
  return questionCount * 1200;
}
