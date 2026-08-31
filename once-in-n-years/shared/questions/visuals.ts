import { asPercent, expectedCount, noneProbability } from "../math";
import type { AnswerKey, GraphOption, PublicQuestion } from "./types";
import { id, pick, timelineGraph } from "./kit";

export function graphTimeline(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const T = pick(rng, [10, 20]);
  const years = 50;
  const expected = expectedCount(T, years);
  const qid = id("gtl", rng);
  const regular: number[] = [];
  for (let y = T; y <= years; y += T) regular.push(y);
  const clustered = [2, 3, 4, 6, 8];
  const empty: number[] = [];
  const irregular = T === 10 ? [4, 11, 18, 33, 41] : [7, 22, 29];
  const graphs: GraphOption[] = [
    {
      id: "a",
      title: "Metronome",
      caption: `Events exactly every ${T} years`,
      data: timelineGraph(years, regular, `${T}-year event`),
    },
    {
      id: "b",
      title: "Random average",
      caption: `About ${expected} events, irregular gaps`,
      data: timelineGraph(years, irregular, `${T}-year event`),
    },
    {
      id: "c",
      title: "Always on",
      caption: "An event almost every year",
      data: timelineGraph(years, clustered.concat([12, 16, 20, 24, 28, 32, 36, 40, 44, 48]), `${T}-year event`),
    },
    {
      id: "d",
      title: "Never",
      caption: "No events at all in the whole record",
      data: timelineGraph(years, empty, `${T}-year event`),
    },
  ];
  return {
    question: {
      id: qid,
      type: "graph",
      concept: "clustering",
      title: "Read the skyline",
      prompt: `Which timeline best represents a ${T}-year event over ${years} years?`,
      context: `You should expect about ${expected} events on average, but not equally spaced. A completely empty record is possible but not the best picture of the long-term average. A tick every ${T} years is the common misconception.`,
      graphs,
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation: `A ${T}-year event has p = ${asPercent(1 / T, 0)}% each year. Over ${years} years the average count is ${expected}, but the gaps wander. Equal spacing would be a schedule, which a return period is not.`,
      misconception: "Students often pick the perfectly spaced ticks because “once in N years” sounds regular.",
      requiredTokens: ["irregular", "average"],
    },
  };
}

export function graphBars(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("gbars", rng);
  const graphs: GraphOption[] = [
    {
      id: "a",
      title: "Equal chances",
      caption: "10-year and 100-year events drawn as the same height",
      data: {
        kind: "probability-bars",
        bars: [
          { label: "10-year event", probability: 0.1 },
          { label: "100-year event", probability: 0.1 },
        ],
      },
    },
    {
      id: "b",
      title: "Correct odds",
      caption: "10% versus 1% annual chance",
      data: {
        kind: "probability-bars",
        bars: [
          { label: "10-year event", probability: 0.1 },
          { label: "100-year event", probability: 0.01 },
        ],
      },
    },
    {
      id: "c",
      title: "Backwards",
      caption: "The 100-year event drawn as more likely",
      data: {
        kind: "probability-bars",
        bars: [
          { label: "10-year event", probability: 0.01 },
          { label: "100-year event", probability: 0.1 },
        ],
      },
    },
    {
      id: "d",
      title: "Hundred percent",
      caption: "Both events shown as certain this year",
      data: {
        kind: "probability-bars",
        bars: [
          { label: "10-year event", probability: 1 },
          { label: "100-year event", probability: 1 },
        ],
      },
    },
  ];
  return {
    question: {
      id: qid,
      type: "graph",
      concept: "rarity",
      title: "Taller bar, more likely",
      prompt: "Which chart correctly compares the annual probability of a 10-year event and a 100-year event?",
      context: "Annual probability is 1/T. Taller bar = more likely this year = shorter return period.",
      graphs,
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation:
        "A 10-year event: 10% this year. A 100-year event: 1% this year. The rarer event is the smaller bar, not the larger number in the nickname.",
      misconception: "The “100” in “100-year event” is not a probability and not a magnitude bar.",
      requiredTokens: ["10%", "1%"],
    },
  };
}

export function graphRain(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("grain", rng);
  const years = 40;
  const make = (peaks: number[]) => {
    const values = Array.from({ length: years }, (_, i) => 20 + ((i * 17) % 35));
    for (const p of peaks) {
      if (p >= 0 && p < years) values[p] = 110;
    }
    return values;
  };
  const graphs: GraphOption[] = [
    {
      id: "a",
      title: "Two exceedances, irregular gaps",
      caption: "Crosses 100 mm twice, 18 years apart, then a long quiet spell",
      data: { kind: "rainfall", values: make([1, 19]), threshold: 100, unit: "mm" },
    },
    {
      id: "b",
      title: "Exactly every 50 years",
      caption: "A spike on a fixed 50-year grid",
      data: { kind: "rainfall", values: make([39]), threshold: 100, unit: "mm" },
    },
    {
      id: "c",
      title: "Always above the line",
      caption: "Every year exceeds 100 mm",
      data: {
        kind: "rainfall",
        values: Array.from({ length: years }, () => 120),
        threshold: 100,
        unit: "mm",
      },
    },
    {
      id: "d",
      title: "A smooth increase",
      caption: "Rainfall climbs steadily so the threshold is inevitable in year 50",
      data: {
        kind: "rainfall",
        values: Array.from({ length: years }, (_, i) => 10 + i * 2.5),
        threshold: 100,
        unit: "mm",
      },
    },
  ];
  return {
    question: {
      id: qid,
      type: "graph",
      concept: "not-a-schedule",
      title: "The Observatory’s rainfall sketch",
      prompt:
        "The Observatory’s teaching figure used fictitious hourly rainfall. Which sketch best matches their point: two exceedances close together, then a long gap, even if the estimated return period is 50 years?",
      context: "Limited data, random timing, and an estimated — not scheduled — return period.",
      graphs,
    },
    key: {
      id: qid,
      kind: "choice",
      value: "a",
      explanation:
        "In the Observatory example, hourly rainfall over 100 mm occurred in year 2 and year 20 (18 years apart), then not again for at least 30 years, while the fitted return period was 50 years. The first two events being close was coincidence, not a timetable.",
      misconception: "A 50-year return period does not place a spike on year 50.",
      requiredTokens: ["18", "average"],
    },
  };
}

export function simQuestion(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const T = pick(rng, [10, 20, 50, 100]);
  const qid = id("sim", rng);
  const n = T === 100 ? 100 : 50;
  const none = asPercent(noneProbability(T, n), 0);
  return {
    question: {
      id: qid,
      type: "sim",
      concept: "expected-count",
      title: "Shake the dice",
      prompt: `Simulate a ${T}-year event. After you run it, choose the statement that matches what return periods mean.`,
      context: `Expected count over ${n} years is ${expectedCount(T, n)}. Your run will probably not hit that number exactly.`,
      sim: {
        returnPeriod: T,
        yearsOptions: [10, 50, 100],
        defaultYears: n,
        promptAfterRun: "What is the right way to read your simulation?",
      },
      choices: [
        { id: "a", label: "If my count is not exactly the expected value, the slider must be broken." },
        { id: "b", label: "Different runs can show 0, 1, or several events even though p never changed." },
        { id: "c", label: "The first run is the true return period; later runs are errors." },
        { id: "d", label: `A ${T}-year event is impossible in a ${n}-year simulation.` },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation: `Each year is a fresh ${asPercent(1 / T, 1)}% coin flip. Over ${n} years you expect about ${expectedCount(T, n)} event(s), but the chance of none at all is about ${none}%. Re-running with the same T is supposed to look different. That is the lesson.`,
      misconception: "Students treat one simulation as the definition of T. T is the probability setting, not the outcome.",
      requiredTokens: ["different", "probability"],
    },
  };
}
