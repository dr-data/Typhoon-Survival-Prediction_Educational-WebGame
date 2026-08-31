import { describe, expect, it } from "vitest";
import {
  CLASSIC_100_IN_100,
  annualProbability,
  atLeastOnceProbability,
  binomialCoefficient,
  createRng,
  empiricalReturnPeriod,
  exactlyKProbability,
  expectedCount,
  noneProbability,
  numericMatches,
  parseStudentNumber,
  returnPeriod,
  roundTo,
  simulateEvents,
} from "../shared/math";

describe("return period algebra", () => {
  it("converts annual probability 1% into a 100-year return period", () => {
    expect(returnPeriod(0.01)).toBe(100);
    expect(annualProbability(100)).toBe(0.01);
  });

  it("converts a 20-year event into a 5% annual probability", () => {
    expect(annualProbability(20)).toBeCloseTo(0.05, 12);
    expect(returnPeriod(0.05)).toBe(20);
  });

  it("is invertible for classroom values", () => {
    for (const T of [2, 5, 10, 20, 25, 50, 100, 200]) {
      expect(returnPeriod(annualProbability(T))).toBeCloseTo(T, 10);
    }
  });

  it("rejects impossible probabilities and non-positive return periods", () => {
    expect(() => returnPeriod(0)).toThrow();
    expect(() => returnPeriod(1.2)).toThrow();
    expect(() => annualProbability(0)).toThrow();
    expect(() => annualProbability(-10)).toThrow();
  });
});

describe("multi-year probability", () => {
  it("gives about 63.4% chance of at least one 100-year event in 100 years", () => {
    expect(CLASSIC_100_IN_100).toBeCloseTo(1 - 0.99 ** 100, 12);
    expect(roundTo(CLASSIC_100_IN_100 * 100, 1)).toBe(63.4);
  });

  it("is 1 − (1 − 1/T)^n", () => {
    const T = 50;
    const n = 10;
    expect(atLeastOnceProbability(T, n)).toBeCloseTo(1 - (1 - 1 / T) ** n, 12);
  });

  it("is zero over zero years and one if T = 1", () => {
    expect(atLeastOnceProbability(10, 0)).toBe(0);
    expect(atLeastOnceProbability(1, 5)).toBe(1);
  });

  it("none + at least once sums to 1", () => {
    expect(noneProbability(20, 30) + atLeastOnceProbability(20, 30)).toBeCloseTo(
      1,
      12,
    );
  });

  it("expected count is n / T", () => {
    expect(expectedCount(10, 50)).toBe(5);
    expect(expectedCount(100, 100)).toBe(1);
  });
});

describe("binomial details", () => {
  it("computes binomial coefficients used in exactly-k questions", () => {
    expect(binomialCoefficient(5, 2)).toBe(10);
    expect(binomialCoefficient(10, 0)).toBe(1);
    expect(binomialCoefficient(10, 10)).toBe(1);
  });

  it("P(exactly 0) matches the none formula", () => {
    expect(exactlyKProbability(25, 10, 0)).toBeCloseTo(
      noneProbability(25, 10),
      12,
    );
  });
});

describe("empirical vs theoretical return period", () => {
  it("treats 2 events in 50 years as a naive 25-year return period", () => {
    expect(empiricalReturnPeriod(2, 50)).toBe(25);
  });

  it("is infinite when the record contains no events", () => {
    expect(empiricalReturnPeriod(0, 50)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("student number parsing and matching", () => {
  it("accepts percents, decimals, and fractions", () => {
    expect(parseStudentNumber("5%")).toBeCloseTo(0.05);
    expect(parseStudentNumber("0.05")).toBe(0.05);
    expect(parseStudentNumber("1/20")).toBe(0.05);
    expect(parseStudentNumber(50)).toBe(50);
  });

  it("treats 5 and 0.05 as the same 5% probability", () => {
    expect(numericMatches(5, 0.05, "probability")).toBe(true);
    expect(numericMatches(0.05, 0.05, "probability")).toBe(true);
    expect(numericMatches(0.05, 5, "percent")).toBe(true);
  });

  it("rejects a clearly wrong return period", () => {
    expect(numericMatches(10, 100, "years")).toBe(false);
  });
});

describe("simulation", () => {
  it("is reproducible for a given seed", () => {
    const a = simulateEvents(10, 40, createRng(42));
    const b = simulateEvents(10, 40, createRng(42));
    expect(a.eventYears).toEqual(b.eventYears);
  });

  it("produces different histories with different seeds", () => {
    const a = simulateEvents(10, 80, createRng(1));
    const b = simulateEvents(10, 80, createRng(2));
    expect(a.eventYears.join(",")).not.toBe(b.eventYears.join(","));
  });

  it("keeps the annual probability fixed regardless of outcome", () => {
    const result = simulateEvents(100, 100, createRng(7));
    expect(result.annualProbability).toBe(0.01);
    expect(result.expectedCount).toBe(1);
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
