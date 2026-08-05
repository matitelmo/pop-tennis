import { describe, expect, it } from "vitest";
import {
  buildRankedPlayers,
  computeWeeklyPairings,
  isWithinRankWindow,
} from "@/lib/weekly-match";

describe("buildRankedPlayers", () => {
  it("assigns ranks by rating descending", () => {
    const ranked = buildRankedPlayers([
      { id: "a", rating: 1200 },
      { id: "b", rating: 1600 },
      { id: "c", rating: 1400 },
    ]);
    expect(ranked.map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3]);
  });
});

describe("isWithinRankWindow", () => {
  it("allows ranks within 3 positions", () => {
    expect(isWithinRankWindow(5, 7, 3)).toBe(true);
    expect(isWithinRankWindow(5, 9, 3)).toBe(false);
  });
});

describe("computeWeeklyPairings", () => {
  it("creates symmetric pairings within rank window", () => {
    const players = buildRankedPlayers([
      { id: "p1", rating: 2000 },
      { id: "p2", rating: 1800 },
      { id: "p3", rating: 1600 },
      { id: "p4", rating: 1400 },
    ]);

    const pairings = computeWeeklyPairings(players, new Set());

    expect(pairings.get("p1")).toBe("p2");
    expect(pairings.get("p2")).toBe("p1");
    expect(pairings.get("p3")).toBe("p4");
    expect(pairings.get("p4")).toBe("p3");
  });

  it("respects cooldown pairs", () => {
    const players = buildRankedPlayers([
      { id: "p1", rating: 2000 },
      { id: "p2", rating: 1800 },
      { id: "p3", rating: 1600 },
    ]);
    const cooldown = new Set(["p1:p2"]);

    const pairings = computeWeeklyPairings(players, cooldown);

    expect(pairings.get("p1")).toBe("p3");
    expect(pairings.get("p3")).toBe("p1");
    expect(pairings.has("p2")).toBe(false);
  });

  it("leaves odd player unpaired when outside rank window of remaining", () => {
    const players = buildRankedPlayers([
      { id: "p1", rating: 2000 },
      { id: "p2", rating: 1900 },
      { id: "p3", rating: 1800 },
      { id: "p4", rating: 1700 },
      { id: "p5", rating: 1200 },
    ]);

    const pairings = computeWeeklyPairings(players, new Set());

    expect(pairings.get("p1")).toBe("p2");
    expect(pairings.get("p3")).toBe("p4");
    expect(pairings.has("p5")).toBe(false);
  });
});
