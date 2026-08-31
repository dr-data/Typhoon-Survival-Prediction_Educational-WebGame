import {
  annualProbability,
  asPercent,
  atLeastOnceProbability,
  createRng,
  empiricalReturnPeriod,
  expectedCount,
  noneProbability,
  roundTo,
} from "../math";
import type {
  AnswerKey,
  ConceptId,
  Difficulty,
  GraphOption,
  Hazard,
  PublicQuestion,
  Quiz,
} from "./types";

const HAZARDS: Hazard[] = [
  "hourly rainfall above 100 mm",
  "a coastal flood",
  "an extreme heatwave",
  "a severe storm surge",
  "a rare landslide-triggering rainstorm",
];

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function id(prefix: string, rng: () => number): string {
  return `${prefix}-${Math.floor(rng() * 1e9).toString(16)}`;
}

function hazard(rng: () => number): Hazard {
  return pick(rng, HAZARDS);
}

function shuffle<T>(rng: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

function chipsFrom(rng: () => number, items: { label: string; value: string }[]) {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
  return shuffle(rng, unique).slice(0, 4);
}

function timelineGraph(
  years: number,
  eventYears: number[],
  thresholdLabel: string,
): GraphOption["data"] {
  return { kind: "timeline", years, eventYears, thresholdLabel };
}

function calcTFromP(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

function calcPFromT(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

function calcAtLeastOnce(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

function mcqNotASchedule(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const T = pick(rng, [20, 50, 100]);
  const qid = id("nas", rng);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "not-a-schedule",
      title: "The calendar myth",
      prompt: `Does a ${T}-year event happen exactly once every ${T} years?`,
      context:
        "The Hong Kong Observatory stresses that a return period is a long-term statistical average, not a guarantee.",
      choices: [
        { id: "a", label: `Yes. Exactly one ${T}-year event occurs in every ${T}-year block.` },
        { id: "b", label: "No. It is an average rate. A stretch of that length may see none, one, or several." },
        { id: "c", label: `It happens once, then cannot happen again for ${T} years.` },
        { id: "d", label: "It happens on a fixed calendar, like a leap year." },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation: `A ${T}-year return period means that, over a very long time, events occur about once per ${T} years on average. In any particular ${T}-year window you might see zero, one, or several. Random sequences cluster.`,
      misconception: "“Once in N years” sounds like a timetable. It is not.",
      requiredTokens: ["average", "not"],
    },
  };
}

function mcqIndependence(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const T = pick(rng, [50, 100]);
  const qid = id("ind", rng);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "independence",
      title: "Last year used it up?",
      prompt: `A ${T}-year rainstorm happened last year. What is the best statement about this year?`,
      context: "Under the standard teaching model, each year is an independent draw with the same probability.",
      choices: [
        { id: "a", label: `This year is almost safe — we have used up the ${T}-year event.` },
        { id: "b", label: `The chance is still about 1/${T} this year. Last year does not cancel this year.` },
        { id: "c", label: "It is now more likely, because rare events come in pairs." },
        { id: "d", label: `It cannot happen again for ${T} years.` },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation: `If years are independent, last year’s storm does not spend a quota. This year’s chance is still about ${asPercent(1 / T, 0)}%. Nature does not keep a calendar of “used” events. (Climate change can slowly change p, but not because last year “used up” the event.)`,
      misconception: "The gambler’s fallacy — thinking a rare event is now less likely because it just happened.",
      requiredTokens: ["still", "1/"],
    },
  };
}

function mcqTwiceInTen(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("twice", rng);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "clustering",
      title: "Two in ten years?!",
      prompt: "Can a 100-year event happen twice within 10 years?",
      context: "Extreme events are random. Unlikely is not impossible.",
      choices: [
        { id: "a", label: "No. A 100-year event can happen at most once per century." },
        { id: "b", label: "Only if the return period was calculated incorrectly." },
        { id: "c", label: "Yes. It is unlikely, but two close events do not break the definition." },
        { id: "d", label: "Yes, and that would prove it is actually a 5-year event." },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "c",
      explanation:
        "The chance of two 100-year events in 10 years is small, but it is not zero. The Hong Kong Observatory’s rainfall example shows two exceedances only 18 years apart, then a long quiet spell — clustering and droughts of events are both normal.",
      misconception: "Two close events do not automatically rewrite the return period, though they can update an estimate when data are scarce.",
      requiredTokens: ["unlikely", "possible"],
    },
  };
}

function mcqRarity(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("rare", rng);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "rarity",
      title: "Which is the rarer beast?",
      prompt: "Which event is rarer: a 10-year event or a 100-year event?",
      context: "Longer return period means a smaller annual probability, so the event is more extreme and less frequent on average.",
      choices: [
        { id: "a", label: "A 10-year event, because 10 is a smaller number." },
        { id: "b", label: "A 100-year event — p = 1% versus 10%." },
        { id: "c", label: "They are equally rare; only the name changes." },
        { id: "d", label: "It depends on the month." },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation:
        "A 100-year event has annual probability 1/100 = 1%. A 10-year event has 1/10 = 10%. The Observatory notes: the longer the return period, the rarer and more extreme the event.",
      misconception: "The number N is a waiting-time average, not a severity score you read backwards.",
      requiredTokens: ["1%", "10%"],
    },
  };
}

function mcqDataLimits(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("data", rng);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "data-limits",
      title: "Why estimates jump when a new record arrives",
      prompt:
        "Why can the estimated return period of an extreme rainstorm change a lot after one new observation?",
      context:
        "The Observatory shows a fitted curve shifting from 50.0 years to 34.1 years after a single extra extreme point.",
      choices: [
        { id: "a", label: "Because return periods are chosen by engineers, not by data." },
        { id: "b", label: "Because extreme events are rare, so a short record is sensitive to one extra point." },
        { id: "c", label: "Because probability cannot be estimated from weather." },
        { id: "d", label: "Because 50-year events are forbidden after year 50." },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation:
        "Extremes are scarce. If your record is short, one extra storm can swing the fitted tail. Different statistical methods (simple counting versus a smoothed curve) also disagree. Treat estimates as useful, not as carved in stone.",
      misconception: "A published “50-year storm” is an estimate. New data, new methods, and a changing climate can all revise it.",
      requiredTokens: ["rare", "sensitive"],
    },
  };
}

function mcqClimate(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("clim", rng);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "climate-change",
      title: "A moving background",
      prompt: "How can climate change affect return periods of extreme rain or heat?",
      context:
        "The Observatory quotes the market proverb: past performance is no guide to future performance. Models generally point to more frequent extremes.",
      choices: [
        { id: "a", label: "Return periods are physical constants, like the boiling point of water." },
        { id: "b", label: "If extremes become more frequent, return periods get shorter — yesterday’s 100-year event may become a 20-year event." },
        { id: "c", label: "Climate change only affects averages, never extremes." },
        { id: "d", label: "Return periods get longer because we have more thermometers." },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation:
        "If the annual probability p rises, T = 1/p falls. Using only past data can lag behind a warming climate. That is why “100-year” labels need care in planning.",
      misconception: "A historical return period is not a promise about the next century’s climate.",
      requiredTokens: ["shorter", "more frequent"],
    },
  };
}

function mcqEmpirical(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
  const qid = id("emp", rng);
  const count = 2;
  const years = 50;
  const naive = empiricalReturnPeriod(count, years);
  return {
    question: {
      id: qid,
      type: "mcq",
      concept: "empirical-vs-fitted",
      title: "Two ways to read the same record",
      prompt: `A 50-year rainfall record shows ${count} hours above 100 mm. Naive counting says the return period is ${naive} years. A smoothed statistical curve fitted to the same (fictitious) Observatory-style example gave 50 years. What is the lesson?`,
      context: "Method matters. Limited data plus a choice of model can change N.",
      choices: [
        { id: "a", label: "The curve must be wrong, because counting is always exact." },
        { id: "b", label: "Both are estimates. Simple counting and a fitted distribution can disagree, especially in the tail." },
        { id: "c", label: "Return periods can only be whole numbers that divide the record length." },
        { id: "d", label: "If two methods disagree, the event cannot have a return period." },
      ],
    },
    key: {
      id: qid,
      kind: "choice",
      value: "b",
      explanation:
        "Counting 2 events in 50 years gives 25 years. Fitting a distribution uses more of the rainfall record, not just the exceedances, and in the Observatory’s figure produced 50.0 years. Different methods, same data, different N — that is a feature of scarce extremes, not a bug in the idea of a return period.",
      misconception: "There is no single magic N hiding in a short series. There is an estimate.",
      requiredTokens: ["estimate", "method"],
    },
  };
}

function graphTimeline(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

function graphBars(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

function graphRain(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

function simQuestion(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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
