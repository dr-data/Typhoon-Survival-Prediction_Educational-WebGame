import { asPercent, empiricalReturnPeriod } from "../math";
import type { AnswerKey, PublicQuestion } from "./types";
import { id, pick } from "./kit";

export function mcqNotASchedule(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

export function mcqIndependence(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

export function mcqTwiceInTen(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

export function mcqRarity(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

export function mcqDataLimits(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

export function mcqClimate(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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

export function mcqEmpirical(rng: () => number): { question: PublicQuestion; key: AnswerKey } {
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
