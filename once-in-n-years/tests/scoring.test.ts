import { describe, expect, it } from "vitest";
import {
  BASE_POINTS,
  CHALLENGE_MULTIPLIER,
  gradeAnswer,
  minimumHonestDurationMs,
  streakBonus,
  timeBonus,
} from "../shared/scoring";

describe("scoring", () => {
  it("awards base points plus a full time bonus for an instant correct answer", () => {
    const result = gradeAnswer({
      kind: "correct",
      elapsedMs: 0,
      previousStreak: 0,
      previousBestStreak: 0,
      difficulty: "practice",
    });
    expect(result.points).toBe(BASE_POINTS + 50);
    expect(result.streak).toBe(1);
  });

  it("gives no points and resets the streak on a miss", () => {
    const result = gradeAnswer({
      kind: "incorrect",
      elapsedMs: 400,
      previousStreak: 6,
      previousBestStreak: 6,
      difficulty: "challenge",
    });
    expect(result.points).toBe(0);
    expect(result.streak).toBe(0);
    expect(result.bestStreak).toBe(6);
  });

  it("applies the challenge multiplier and streak bonus", () => {
    const result = gradeAnswer({
      kind: "correct",
      elapsedMs: 25_000,
      previousStreak: 4,
      previousBestStreak: 4,
      difficulty: "challenge",
    });
    expect(result.streak).toBe(5);
    expect(result.streakBonus).toBe(20);
    expect(timeBonus(25_000)).toBe(0);
    expect(result.points).toBe(Math.round((BASE_POINTS + 20) * CHALLENGE_MULTIPLIER));
  });

  it("awards partial credit without keeping the streak", () => {
    const result = gradeAnswer({
      kind: "partial",
      elapsedMs: 1000,
      previousStreak: 3,
      previousBestStreak: 3,
      difficulty: "practice",
    });
    expect(result.points).toBe(40);
    expect(result.streak).toBe(0);
  });

  it("tiers streak bonuses at 3, 5, and 8", () => {
    expect(streakBonus(2)).toBe(0);
    expect(streakBonus(3)).toBe(10);
    expect(streakBonus(5)).toBe(20);
    expect(streakBonus(8)).toBe(30);
  });

  it("rejects impossibly fast quiz completions", () => {
    expect(minimumHonestDurationMs(10)).toBe(12_000);
  });
});
