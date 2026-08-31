import { describe, expect, it } from "vitest";
import { CLASSIC_100_IN_100, asPercent, roundTo } from "../shared/math";
import { buildQuiz } from "../shared/questions/generate";
import { gradeRun } from "../shared/questions/grade";

describe("quiz generation", () => {
  it("builds a reproducible practice set with mixed types", () => {
    const a = buildQuiz(123, "practice");
    const b = buildQuiz(123, "practice");
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
    const types = new Set(a.questions.map((q) => q.type));
    expect(types.has("calc")).toBe(true);
    expect(types.has("mcq")).toBe(true);
    expect(types.has("graph")).toBe(true);
    expect(types.has("sim")).toBe(true);
    expect(a.keys).toHaveLength(a.questions.length);
  });

  it("makes challenge mode longer and includes at-least-once arithmetic", () => {
    const quiz = buildQuiz(99, "challenge");
    expect(quiz.questions.length).toBeGreaterThan(buildQuiz(99, "practice").questions.length);
    expect(quiz.questions.some((q) => q.concept === "at-least-once")).toBe(true);
    expect(quiz.questions.some((q) => q.concept === "climate-change")).toBe(true);
  });

  it("gives calculation questions tappable answer chips", () => {
    const quiz = buildQuiz(11, "practice");
    const calcs = quiz.questions.filter((q) => q.type === "calc");
    expect(calcs.length).toBeGreaterThan(0);
    for (const question of calcs) {
      expect(question.chips?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("never lets an answer key drift from the public question id", () => {
    const quiz = buildQuiz(7, "challenge");
    for (const question of quiz.questions) {
      const key = quiz.keys.find((entry) => entry.id === question.id);
      expect(key).toBeTruthy();
    }
  });
});

describe("grading from seed", () => {
  it("scores a perfect challenge run using server-side keys", () => {
    const quiz = buildQuiz(2026, "challenge");
    const answers = quiz.keys.map((key) => ({
      questionId: key.id,
      value: key.value,
      elapsedMs: 8000,
    }));
    const report = gradeRun(2026, "challenge", answers);
    expect(report.incorrect).toBe(0);
    expect(report.correct).toBe(quiz.questions.length);
    expect(report.totalPoints).toBeGreaterThan(0);
  });

  it("does not trust a client-supplied score — wrong answers score zero", () => {
    const quiz = buildQuiz(3, "practice");
    const answers = quiz.questions.map((question) => ({
      questionId: question.id,
      value: "zzz",
      elapsedMs: 1000,
    }));
    const report = gradeRun(3, "practice", answers);
    expect(report.totalPoints).toBe(0);
    expect(report.correct).toBe(0);
  });
});

describe("classic 100-in-100 teaching number", () => {
  it("is 63.4% to one decimal, not 100%", () => {
    expect(roundTo(asPercent(CLASSIC_100_IN_100, 1), 1)).toBe(63.4);
  });
});
