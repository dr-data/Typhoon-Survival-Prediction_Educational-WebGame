/**
 * Return-period mathematics used by both the game client and the Worker.
 *
 * A return period T is the long-term average time between events whose
 * annual probability is p. It is not a schedule:
 *
 *   T = 1 / p
 *
 * Years are modelled as independent Bernoulli trials. That is the standard
 * teaching model used by the Hong Kong Observatory's "once in N years"
 * explanation. Real climate is more complex (serial correlation, changing
 * climate), and the game surfaces those caveats after the core idea lands.
 */

export type SimulationResult = {
  years: number;
  returnPeriod: number;
  annualProbability: number;
  events: boolean[];
  eventYears: number[];
  count: number;
  expectedCount: number;
  gaps: number[];
};

export function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`);
  }
}

/** Annual probability p from return period T (years). p = 1 / T */
export function annualProbability(returnPeriodYears: number): number {
  assertPositiveFinite(returnPeriodYears, "return period");
  return 1 / returnPeriodYears;
}

/** Return period T from annual probability p. T = 1 / p */
export function returnPeriod(annualProbabilityValue: number): number {
  if (
    !Number.isFinite(annualProbabilityValue) ||
    annualProbabilityValue <= 0 ||
    annualProbabilityValue > 1
  ) {
    throw new Error("annual probability must be in (0, 1]");
  }
  return 1 / annualProbabilityValue;
}

/**
 * Probability of at least one event in n independent years:
 *   P = 1 − (1 − 1/T)^n
 */
export function atLeastOnceProbability(
  returnPeriodYears: number,
  years: number,
): number {
  assertPositiveFinite(returnPeriodYears, "return period");
  if (!Number.isInteger(years) || years < 0) {
    throw new Error("years must be a non-negative integer");
  }
  const p = annualProbability(returnPeriodYears);
  return 1 - (1 - p) ** years;
}

/** Probability of zero events in n independent years. */
export function noneProbability(
  returnPeriodYears: number,
  years: number,
): number {
  return 1 - atLeastOnceProbability(returnPeriodYears, years);
}

/** Expected number of events in n years: n / T */
export function expectedCount(
  returnPeriodYears: number,
  years: number,
): number {
  assertPositiveFinite(returnPeriodYears, "return period");
  if (!Number.isFinite(years) || years < 0) {
    throw new Error("years must be a non-negative finite number");
  }
  return years / returnPeriodYears;
}

export function binomialCoefficient(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
    throw new Error("n and k must be integers with 0 ≤ k ≤ n");
  }
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= kk; i += 1) {
    result = (result * (n - kk + i)) / i;
  }
  return result;
}

/** P(exactly k events in n years) under independence. */
export function exactlyKProbability(
  returnPeriodYears: number,
  years: number,
  k: number,
): number {
  assertPositiveFinite(returnPeriodYears, "return period");
  if (!Number.isInteger(years) || years < 0) {
    throw new Error("years must be a non-negative integer");
  }
  if (!Number.isInteger(k) || k < 0 || k > years) {
    throw new Error("k must be an integer with 0 ≤ k ≤ years");
  }
  const p = annualProbability(returnPeriodYears);
  return binomialCoefficient(years, k) * p ** k * (1 - p) ** (years - k);
}

/** Naive empirical return period from a count in a record of given length. */
export function empiricalReturnPeriod(
  eventCount: number,
  recordYears: number,
): number {
  assertPositiveFinite(recordYears, "record length");
  if (!Number.isFinite(eventCount) || eventCount < 0) {
    throw new Error("event count must be a non-negative finite number");
  }
  if (eventCount === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return recordYears / eventCount;
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function asPercent(probability: number, digits = 1): number {
  return roundTo(probability * 100, digits);
}

/**
 * Parse a student numeric answer. Accepts 5, "5", "5%", "0.05", "1/20".
 * `as` tells us whether the canonical value is a probability (0–1), a
 * percent (0–100), or years.
 */
export function parseStudentNumber(raw: string | number): number {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) throw new Error("Answer must be a finite number");
    return raw;
  }
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) throw new Error("Please enter a number");

  const fraction = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denom = Number(fraction[2]);
    if (denom === 0) throw new Error("Division by zero");
    return Number(fraction[1]) / denom;
  }

  const percent = trimmed.endsWith("%");
  const numeric = Number(percent ? trimmed.slice(0, -1) : trimmed);
  if (!Number.isFinite(numeric)) throw new Error("Answer must be a number");
  return percent ? numeric / 100 : numeric;
}

export type NumericUnit = "years" | "probability" | "percent";

/**
 * Compare a student number with a canonical value.
 * Canonical probabilities are stored in 0–1. Students often type 5 for 5%.
 */
export function numericMatches(
  student: number,
  expected: number,
  unit: NumericUnit,
  relativeTolerance = 0.02,
  absoluteTolerance = 0.005,
): boolean {
  const candidates = [student];
  if (unit === "probability") {
    if (student > 1 && student <= 100) candidates.push(student / 100);
    if (student > 0 && student <= 1) candidates.push(student * 100);
  }
  if (unit === "percent") {
    if (student > 0 && student <= 1) candidates.push(student * 100);
    if (student > 1) candidates.push(student / 100);
  }

  return candidates.some((value) => {
    const abs = Math.abs(value - expected);
    const rel = Math.abs(expected) < 1e-12 ? abs : abs / Math.abs(expected);
    return abs <= absoluteTolerance || rel <= relativeTolerance;
  });
}

/** Mulberry32 — a tiny seeded PRNG so simulations are reproducible. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  if (a === 0) a = 0x9e3779b9;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateEvents(
  returnPeriodYears: number,
  years: number,
  rng: () => number,
): SimulationResult {
  assertPositiveFinite(returnPeriodYears, "return period");
  if (!Number.isInteger(years) || years <= 0) {
    throw new Error("years must be a positive integer");
  }
  const p = annualProbability(returnPeriodYears);
  const events: boolean[] = [];
  const eventYears: number[] = [];
  for (let year = 1; year <= years; year += 1) {
    const happened = rng() < p;
    events.push(happened);
    if (happened) eventYears.push(year);
  }
  const gaps: number[] = [];
  for (let i = 1; i < eventYears.length; i += 1) {
    gaps.push(eventYears[i] - eventYears[i - 1]);
  }
  return {
    years,
    returnPeriod: returnPeriodYears,
    annualProbability: p,
    events,
    eventYears,
    count: eventYears.length,
    expectedCount: expectedCount(returnPeriodYears, years),
    gaps,
  };
}

export function interpretSimulation(result: SimulationResult): string {
  const { count, expectedCount: expected, years, returnPeriod: T } = result;
  const expectedRounded = roundTo(expected, 1);
  if (count === 0) {
    return `In this ${years}-year run of a ${T}-year event, nothing happened. That is allowed. The chance of a quiet stretch is ${(asPercent(noneProbability(T, years)))}%. A return period is an average, not a booking.`;
  }
  if (Math.abs(count - expected) < 0.5) {
    return `This run produced ${count} event${count === 1 ? "" : "s"} in ${years} years — close to the long-term average of ${expectedRounded}. Other runs will look different, even with the same probability.`;
  }
  if (count > expected) {
    const clustered = result.gaps.some((gap) => gap <= 3);
    return `This run produced ${count} events (average would be about ${expectedRounded}). ${clustered ? "Some events sat close together — clustering is normal in random sequences." : "A busier-than-average stretch does not mean the return period has changed."} The probability was unchanged.`;
  }
  return `This run produced only ${count} event${count === 1 ? "" : "s"} (average would be about ${expectedRounded}). Quiet decades happen. They do not make next year “safer”.`;
}

export const CLASSIC_100_IN_100 = atLeastOnceProbability(100, 100);
