import { numericMatches, parseStudentNumber } from "../math";
import { gradeAnswer, type GradeKind, type GradeResult } from "../scoring";
import type { Difficulty } from "../scoring";
import { CONCEPT_LABELS, type ConceptScore, type PublicQuestion, type StudentAnswer } from "./types";
import { buildQuiz } from "./generate";

export type GradedQuestion = {
  question: PublicQuestion;
  student: StudentAnswer;
  expected: string | number;
  kind: GradeKind;
  grade: GradeResult;
  explanation: string;
  misconception: string;
};

export type RunReport = {
  seed: number;
  difficulty: Difficulty;
  totalPoints: number;
  correct: number;
  partial: number;
  incorrect: number;
  bestStreak: number;
  durationMs: number;
  concepts: ConceptScore[];
  items: GradedQuestion[];
  summary: string;
  strengths: string[];
  improve: string[];
};

function expectedDisplay(value: string | number, unit?: string): string | number {
  return unit === "probability" && typeof value === "number" ? value : value;
}

export function gradeRun(
  seed: number,
  difficulty: Difficulty,
  answers: StudentAnswer[],
): RunReport {
  const quiz = buildQuiz(seed, difficulty);
  const byId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const items: GradedQuestion[] = [];
  let streak = 0;
  let bestStreak = 0;
  let totalPoints = 0;
  let durationMs = 0;
  const conceptMap = new Map<string, ConceptScore>();

  for (const question of quiz.questions) {
    const key = quiz.keys.find((entry) => entry.id === question.id);
    if (!key) continue;
    const student = byId.get(question.id) ?? {
      questionId: question.id,
      value: "",
      elapsedMs: TIME_FALLBACK,
    };
    durationMs += Math.max(0, student.elapsedMs);
    const kind = mark(key.value, key.kind, key.unit, student.value);
    const grade = gradeAnswer({
      kind,
      elapsedMs: student.elapsedMs,
      previousStreak: streak,
      previousBestStreak: bestStreak,
      difficulty,
    });
    streak = grade.streak;
    bestStreak = grade.bestStreak;
    totalPoints += grade.points;

    const bucket =
      conceptMap.get(question.concept) ?? {
        concept: question.concept,
        label: CONCEPT_LABELS[question.concept],
        attempted: 0,
        correct: 0,
      };
    bucket.attempted += 1;
    if (kind === "correct") bucket.correct += 1;
    conceptMap.set(question.concept, bucket);

    items.push({
      question,
      student,
      expected: expectedDisplay(key.value, key.unit),
      kind,
      grade,
      explanation: key.explanation,
      misconception: key.misconception,
    });
  }

  const concepts = [...conceptMap.values()];
  const correct = items.filter((item) => item.kind === "correct").length;
  const partial = items.filter((item) => item.kind === "partial").length;
  const incorrect = items.filter((item) => item.kind === "incorrect").length;
  const strengths = concepts
    .filter((c) => c.attempted > 0 && c.correct / c.attempted >= 0.8)
    .map((c) => c.label);
  const improve = concepts
    .filter((c) => c.attempted > 0 && c.correct / c.attempted < 0.6)
    .map((c) => c.label);

  const summary = buildSummary({
    difficulty,
    correct,
    total: items.length,
    bestStreak,
    strengths,
    improve,
  });

  return {
    seed,
    difficulty,
    totalPoints,
    correct,
    partial,
    incorrect,
    bestStreak,
    durationMs,
    concepts,
    items,
    summary,
    strengths,
    improve,
  };
}

const TIME_FALLBACK = 20_000;

function mark(
  expected: string | number,
  kind: "number" | "choice",
  unit: "years" | "probability" | "percent" | undefined,
  raw: string | number,
): GradeKind {
  if (kind === "choice") {
    return String(raw) === String(expected) ? "correct" : "incorrect";
  }
  try {
    const parsed = parseStudentNumber(raw);
    const target = Number(expected);
    if (numericMatches(parsed, target, unit ?? "years", 0.02, unit === "years" ? 0.51 : 0.15)) {
      return "correct";
    }
    if (numericMatches(parsed, target, unit ?? "years", 0.12, 1.5)) {
      return "partial";
    }
    return "incorrect";
  } catch {
    return "incorrect";
  }
}

function buildSummary(input: {
  difficulty: Difficulty;
  correct: number;
  total: number;
  bestStreak: number;
  strengths: string[];
  improve: string[];
}): string {
  const ratio = input.total === 0 ? 0 : input.correct / input.total;
  const headline =
    ratio >= 0.85
      ? "You can explain return periods without treating them as a calendar. That is the whole point."
      : ratio >= 0.6
        ? "The core idea is landing: T is an average rate. A few of the trickier ideas still need another pass."
        : "Keep the one-line definition handy: a return period is a long-term average, not a promise.";
  const streak =
    input.bestStreak >= 5
      ? ` Best streak: ${input.bestStreak}.`
      : "";
  const next =
    input.improve.length > 0
      ? ` Revisit: ${input.improve.join("; ")}.`
      : " You were steady across the ideas we tested.";
  return `${headline}${streak}${next}`;
}

export function hintFor(explanation: string, misconception: string, plain: boolean): string {
  if (!plain) return explanation;
  return `${misconception} ${explanation}`;
}
