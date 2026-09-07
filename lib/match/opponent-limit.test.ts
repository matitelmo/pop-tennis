import { describe, expect, it } from "vitest";
import {
  countRecentMatchingMatchups,
  getMatchupKey,
  isSameDoublesMatchup,
  isSameSinglesOpponent,
} from "@/lib/match/opponent-limit";

describe("opponent limit", () => {
  it("treats swapped teams as the same doubles matchup", () => {
    expect(isSameDoublesMatchup(["a", "b"], ["c", "d"], ["c", "d"], ["a", "b"])).toBe(true);
    expect(getMatchupKey(["a", "b"], ["c", "d"])).toBe(getMatchupKey(["c", "d"], ["a", "b"]));
  });

  it("does not count different doubles pairings that share one player", () => {
    expect(isSameDoublesMatchup(["a", "b"], ["c", "d"], ["a", "b"], ["c", "e"])).toBe(false);
    expect(isSameDoublesMatchup(["a", "b"], ["c", "d"], ["a", "c"], ["b", "d"])).toBe(false);
  });

  it("counts same singles opponent regardless of team side", () => {
    expect(isSameSinglesOpponent("a", ["a"], ["b"], ["b"], ["a"])).toBe(true);
    expect(isSameSinglesOpponent("a", ["a"], ["b"], ["a"], ["c"])).toBe(false);
  });

  it("counts only identical doubles matchups in recent history", () => {
    const recent = [
      { team1_ids: ["a", "b"], team2_ids: ["c", "d"] },
      { team1_ids: ["a", "b"], team2_ids: ["c", "e"] },
    ];
    expect(
      countRecentMatchingMatchups("a", ["a", "b"], ["c", "d"], recent, true)
    ).toBe(1);
  });
});
