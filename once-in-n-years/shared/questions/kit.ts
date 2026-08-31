import {
  annualProbability,
  asPercent,
  atLeastOnceProbability,
  roundTo,
} from "../math";
import type {
  AnswerKey,
  GraphOption,
  Hazard,
  PublicQuestion,
} from "./types";

const HAZARDS: Hazard[] = [
  "hourly rainfall above 100 mm",
  "a coastal flood",
  "an extreme heatwave",
  "a severe storm surge",
  "a rare landslide-triggering rainstorm",
];

export function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

export function id(prefix: string, rng: () => number): string {
  return `${prefix}-${Math.floor(rng() * 1e9).toString(16)}`;
}

export function hazard(rng: () => number): Hazard {
  return pick(rng, HAZARDS);
}

export function shuffle<T>(rng: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

export function chipsFrom(rng: () => number, items: { label: string; value: string }[]) {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
  return shuffle(rng, unique).slice(0, 4);
}

export function timelineGraph(
  years: number,
  eventYears: number[],
  thresholdLabel: string,
): GraphOption["data"] {
  return { kind: "timeline", years, eventYears, thresholdLabel };
}

export function calcTFromP(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const pChoices = [0.02, 0.04, 0.05, 0.1, 0.2];
  const p = pick(rng, pChoices);
  const T = 1 / p;
  const event = hazard(rng);
  const qid = id("tfp", rng);
  return {
    question: {
      id: qid,
      type: "calc",
      concept: "t-from-p",
      title: "Name that storm",
      prompt: `The harbour desk says ${event} has a ${asPercent(p, 0)}% chance this year. What nickname would they give it — a how-many-year event?`,
      context:
        "Tap the average wait. A 5% chance each year is a 20-year event. That is a nickname for the average, not a booking.",
      formulaHint: "T = 1 / p   (turn the percent into a decimal first, e.g. 5% = 0.05)",
      unit: "years",
      placeholder: "years",
      chips: chipsFrom(rng, [
        { label: `${T}-year event`, value: String(T) },
        { label: `${asPercent(p, 0)}-year event`, value: String(asPercent(p, 0)) },
        { label: "100-year event", value: "100" },
        { label: "1-year event", value: "1" },
        { label: `${T * 2}-year event`, value: String(T * 2) },
      ]),
    },
    key: {
      id: qid,
      kind: "number",
      value: T,
      unit: "years",
      explanation: `Annual probability p = ${asPercent(p, 0)}% = ${p}. Return period T = 1 / p = ${T} years. That does not promise exactly one event every ${T} years — it is the long-run average.`,
      misconception: "A return period is not a booking. It is an average rate.",
      requiredTokens: ["1 / p", String(T)],
    },
  };
}

export function calcPFromT(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const T = pick(rng, [5, 10, 20, 25, 50, 100]);
  const p = annualProbability(T);
  const event = hazard(rng);
  const qid = id("pft", rng);
  return {
    question: {
      id: qid,
      type: "calc",
      concept: "p-from-t",
      title: "This year’s chance",
      prompt: `Someone calls ${event} a “${T}-year event”. What is the chance it happens this year?`,
      context: "The number in the nickname is not a probability. Flip it: chance this year = 1 ÷ N.",
      formulaHint: "p = 1 / T   (a 20-year event is 5% this year)",
      unit: "probability",
      placeholder: "% or decimal",
      chips: chipsFrom(rng, [
        { label: `${asPercent(p, 0)}% this year`, value: String(p) },
        { label: "100% this year", value: "1" },
        { label: `${T}% this year`, value: String(T / 100) },
        { label: "0% this year", value: "0" },
        { label: "50% this year", value: "0.5" },
      ]),
    },
    key: {
      id: qid,
      kind: "number",
      value: p,
      unit: "probability",
      explanation: `p = 1 / ${T} = ${p} = ${asPercent(p, 0)}% each year. Next year the chance is still ${asPercent(p, 0)}% — last year’s weather does not use up the quota.`,
      misconception: "The event is not “due”. Each year keeps the same chance.",
      requiredTokens: ["1 / T", `${asPercent(p, 0)}%`],
    },
  };
}

export function calcAtLeastOnce(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const pairs = [
    { T: 100, n: 100 },
    { T: 50, n: 50 },
    { T: 20, n: 20 },
    { T: 100, n: 10 },
    { T: 50, n: 10 },
  ];
  const { T, n } = pick(rng, pairs);
  const P = atLeastOnceProbability(T, n);
  const percent = roundTo(P * 100, 1);
  const event = hazard(rng);
  const qid = id("alo", rng);
  return {
    question: {
      id: qid,
      type: "calc",
      concept: "at-least-once",
      title: "A whole career, not one year",
      prompt: `If ${event} is a ${T}-year event, what is the chance it shows up at least once in ${n} years?`,
      context:
        "Do not add the years up. Each year is a fresh roll. The surprise: a 100-year event is not guaranteed in 100 years.",
      formulaHint: "P(at least once) = 1 − (1 − 1/T)^n",
      unit: "percent",
      placeholder: "%",
      chips: chipsFrom(rng, [
        { label: `${percent}%`, value: String(percent) },
        { label: "100%", value: "100" },
        { label: `${asPercent(1 / T, 0)}%`, value: String(asPercent(1 / T, 0)) },
        { label: "50%", value: "50" },
        { label: "0%", value: "0" },
      ]),
    },
    key: {
      id: qid,
      kind: "number",
      value: percent,
      unit: "percent",
      explanation: `P = 1 − (1 − 1/${T})^${n} = 1 − (${roundTo(1 - 1 / T, 4)})^${n} ≈ ${percent}%. ${T === n ? `So a ${T}-year event is not “due once” in ${n} years — the chance it shows up at least once is about ${percent}%, not 100%.` : `That is very different from the single-year chance of ${asPercent(1 / T, 1)}%.`}`,
      misconception:
        "People often answer 100% when n = T, or simply add n/T. Neither is the at-least-once probability.",
      requiredTokens: ["1 − (1 − 1/T)^n", `${percent}`],
    },
  };
}
