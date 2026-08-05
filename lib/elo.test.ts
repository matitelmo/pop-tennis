import { describe, expect, it } from "vitest";
import {
  calculateEloDelta,
  expectedScore,
  getSetsMultiplier,
} from "@/lib/elo";

describe("expectedScore", () => {
  it("returns ~0.5 for equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 2);
  });

  it("returns lower expectation when facing stronger opponent", () => {
    expect(expectedScore(1200, 1600)).toBeLessThan(0.5);
  });
});

describe("multipliers", () => {
  it("applies walkover sets multiplier for 3-0 Bo5", () => {
    expect(
      getSetsMultiplier("1v1_bo5", [
        { p1: 6, p2: 2 },
        { p1: 6, p2: 3 },
        { p1: 6, p2: 1 },
      ])
    ).toBe(1.2);
  });
});

describe("calculateEloDelta", () => {
  it("awards more points for upset win (+300 Elo gap)", () => {
    const upset = calculateEloDelta({
      winnerRatings: [1200],
      loserRatings: [1500],
      format: "1v1_bo3",
      setScores: [
        { p1: 6, p2: 4 },
        { p1: 4, p2: 6 },
        { p1: 7, p2: 5 },
      ],
    });

    const expected = calculateEloDelta({
      winnerRatings: [1200],
      loserRatings: [1200],
      format: "1v1_bo3",
      setScores: [
        { p1: 6, p2: 4 },
        { p1: 4, p2: 6 },
        { p1: 7, p2: 5 },
      ],
    });

    expect(upset.delta).toBeGreaterThan(expected.delta);
  });

  it("returns positive delta for winner", () => {
    const result = calculateEloDelta({
      winnerRatings: [1400, 1300],
      loserRatings: [1200, 1100],
      format: "2v2_bo5",
      setScores: [
        { p1: 6, p2: 2 },
        { p1: 6, p2: 3 },
        { p1: 6, p2: 1 },
      ],
    });

    expect(result.delta).toBeGreaterThan(0);
    expect(result.multipliers.format).toBe(1.0);
    expect(result.multipliers.sets).toBe(1.2);
    expect(result.multipliers.weekly).toBe(1);
  });

  it("applies weekly win multiplier only to winner delta magnitude", () => {
    const base = calculateEloDelta({
      winnerRatings: [1400],
      loserRatings: [1400],
      format: "1v1_bo3",
      setScores: [
        { p1: 6, p2: 4 },
        { p1: 4, p2: 6 },
        { p1: 7, p2: 5 },
      ],
    });

    const weekly = calculateEloDelta({
      winnerRatings: [1400],
      loserRatings: [1400],
      format: "1v1_bo3",
      setScores: [
        { p1: 6, p2: 4 },
        { p1: 4, p2: 6 },
        { p1: 7, p2: 5 },
      ],
      weeklyWinMultiplier: 1.25,
    });

    expect(weekly.delta).toBe(Math.round(base.delta * 1.25));
    expect(weekly.multipliers.weekly).toBe(1.25);
  });
});
