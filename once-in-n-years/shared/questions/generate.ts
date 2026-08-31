import { createRng } from "../math";
import type { AnswerKey, ConceptId, Difficulty, PublicQuestion, Quiz } from "./types";
import { calcAtLeastOnce, calcPFromT, calcTFromP } from "./kit";
import {
  mcqClimate,
  mcqDataLimits,
  mcqEmpirical,
  mcqIndependence,
  mcqNotASchedule,
  mcqRarity,
  mcqTwiceInTen,
} from "./mcq";
import { graphBars, graphRain, graphTimeline, simQuestion } from "./visuals";

type Factory = (rng: () => number) => { question: PublicQuestion; key: AnswerKey };

const PRACTICE_SEQUENCE: Factory[] = [
  calcTFromP,
  calcPFromT,
  mcqNotASchedule,
  mcqRarity,
  graphTimeline,
  mcqTwiceInTen,
  graphBars,
  simQuestion,
];

const CHALLENGE_SEQUENCE: Factory[] = [
  calcTFromP,
  calcPFromT,
  mcqNotASchedule,
  mcqIndependence,
  graphTimeline,
  calcAtLeastOnce,
  mcqTwiceInTen,
  graphRain,
  mcqDataLimits,
  calcAtLeastOnce,
  mcqClimate,
  mcqEmpirical,
  graphBars,
  simQuestion,
];

export function buildQuiz(seed: number, difficulty: Difficulty): Quiz {
  const rng = createRng(seed);
  const sequence = difficulty === "challenge" ? CHALLENGE_SEQUENCE : PRACTICE_SEQUENCE;
  const questions: PublicQuestion[] = [];
  const keys: AnswerKey[] = [];
  for (const factory of sequence) {
    const item = factory(rng);
    questions.push(item.question);
    keys.push(item.key);
  }
  return { seed, difficulty, questions, keys };
}

export function publicQuiz(quiz: Quiz): { seed: number; difficulty: Difficulty; questions: PublicQuestion[] } {
  return { seed: quiz.seed, difficulty: quiz.difficulty, questions: quiz.questions };
}

export const ALL_CONCEPTS: ConceptId[] = [
  "t-from-p",
  "p-from-t",
  "at-least-once",
  "not-a-schedule",
  "independence",
  "clustering",
  "rarity",
  "data-limits",
  "climate-change",
  "expected-count",
  "empirical-vs-fitted",
];
