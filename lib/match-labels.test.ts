import { describe, expect, it } from "vitest";
import { buildMatchPointSummary } from "@/lib/match-labels";

describe("buildMatchPointSummary", () => {
  it("labels an upset win", () => {
    const summary = buildMatchPointSummary({
      winnerRatings: [1200],
      loserRatings: [1500],
      format: "1v1_bo3",
      multipliers: { format: 1.2, sets: 1.0 },
    });

    expect(summary.headline).toBe("Victoria valiosa");
    expect(summary.tags).toContain("Upset");
  });

  it("includes straight sets bonus", () => {
    const summary = buildMatchPointSummary({
      winnerRatings: [1200],
      loserRatings: [1200],
      format: "1v1_bo5",
      multipliers: { format: 1.5, sets: 1.2 },
    });

    expect(summary.tags).toContain("Sets corridos");
    expect(summary.tags).toContain("Singles Bo5");
  });
});
