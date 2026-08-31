export type Difficulty = "practice" | "challenge";

export type QuestionType = "calc" | "mcq" | "graph" | "sim";

export type ConceptId =
  | "t-from-p"
  | "p-from-t"
  | "at-least-once"
  | "not-a-schedule"
  | "independence"
  | "clustering"
  | "rarity"
  | "data-limits"
  | "climate-change"
  | "expected-count"
  | "empirical-vs-fitted";

export type NumericUnit = "years" | "probability" | "percent";

export type Hazard =
  | "hourly rainfall above 100 mm"
  | "a coastal flood"
  | "an extreme heatwave"
  | "a severe storm surge"
  | "a rare landslide-triggering rainstorm";

export type GraphKind = "timeline" | "probability-bars" | "rainfall";

export type TimelineGraph = {
  kind: "timeline";
  years: number;
  eventYears: number[];
  thresholdLabel: string;
};

export type ProbabilityBarsGraph = {
  kind: "probability-bars";
  bars: { label: string; probability: number }[];
};

export type RainfallGraph = {
  kind: "rainfall";
  values: number[];
  threshold: number;
  unit: string;
};

export type GraphData = TimelineGraph | ProbabilityBarsGraph | RainfallGraph;

export type GraphOption = {
  id: string;
  title: string;
  caption: string;
  data: GraphData;
};

export type Choice = {
  id: string;
  label: string;
};

export type PublicQuestion = {
  id: string;
  type: QuestionType;
  concept: ConceptId;
  title: string;
  prompt: string;
  context: string;
  formulaHint?: string;
  unit?: NumericUnit;
  placeholder?: string;
  choices?: Choice[];
  graphs?: GraphOption[];
  sim?: {
    returnPeriod: number;
    yearsOptions: number[];
    defaultYears: number;
    promptAfterRun: string;
  };
};

export type AnswerKey = {
  id: string;
  kind: "number" | "choice";
  value: number | string;
  unit?: NumericUnit;
  explanation: string;
  misconception: string;
  requiredTokens: string[];
};

export type Quiz = {
  seed: number;
  difficulty: Difficulty;
  questions: PublicQuestion[];
  keys: AnswerKey[];
};

export type StudentAnswer = {
  questionId: string;
  value: string | number;
  elapsedMs: number;
};

export type ConceptScore = {
  concept: ConceptId;
  label: string;
  attempted: number;
  correct: number;
};

export const CONCEPT_LABELS: Record<ConceptId, string> = {
  "t-from-p": "Turning probability into a return period",
  "p-from-t": "Annual probability from “once in N years”",
  "at-least-once": "Chance over many years",
  "not-a-schedule": "An average, not a timetable",
  independence: "Last year does not protect this year",
  clustering: "Events can cluster or vanish",
  rarity: "Longer return period = rarer event",
  "data-limits": "Short records are noisy",
  "climate-change": "A changing climate changes T",
  "expected-count": "Expected counts vs actual counts",
  "empirical-vs-fitted": "Counting vs a fitted curve",
};
