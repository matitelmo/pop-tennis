import { describe, expect, it } from "vitest";
import {
  canAddSet,
  getSetValidationError,
  isMatchDecided,
  isValidCompletedSet,
  validateMatchScores,
} from "@/lib/match/set-scores";

describe("getSetValidationError", () => {
  it("accepts standard 6-x sets", () => {
    expect(getSetValidationError({ p1: 6, p2: 4 })).toBeNull();
    expect(getSetValidationError({ p1: 0, p2: 6 })).toBeNull();
  });

  it("accepts 7-5 and 7-6", () => {
    expect(getSetValidationError({ p1: 7, p2: 5 })).toBeNull();
    expect(getSetValidationError({ p1: 6, p2: 7 })).toBeNull();
  });

  it("rejects sets that end before 6", () => {
    expect(getSetValidationError({ p1: 4, p2: 3 })).not.toBeNull();
    expect(getSetValidationError({ p1: 5, p2: 4 })).not.toBeNull();
  });

  it("rejects 6-5 without closing", () => {
    expect(getSetValidationError({ p1: 6, p2: 5 })).not.toBeNull();
  });

  it("rejects ties", () => {
    expect(getSetValidationError({ p1: 6, p2: 6 })).not.toBeNull();
  });
});

describe("isMatchDecided", () => {
  it("decides bo3 after two set wins", () => {
    expect(
      isMatchDecided(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 2 },
        ],
        3
      )
    ).toBe(true);
  });

  it("does not decide bo3 after split sets", () => {
    expect(
      isMatchDecided(
        [
          { p1: 6, p2: 4 },
          { p1: 3, p2: 6 },
        ],
        3
      )
    ).toBe(false);
  });
});

describe("canAddSet", () => {
  it("blocks adding a third set in bo3 when already 2-0", () => {
    expect(
      canAddSet(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 1 },
        ],
        3
      )
    ).toBe(false);
  });

  it("allows third set in bo3 when 1-1", () => {
    expect(
      canAddSet(
        [
          { p1: 6, p2: 4 },
          { p1: 2, p2: 6 },
        ],
        3
      )
    ).toBe(true);
  });

  it("blocks fourth set in bo5 when already 3-0", () => {
    expect(
      canAddSet(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 3 },
          { p1: 6, p2: 2 },
        ],
        5
      )
    ).toBe(false);
  });
});

describe("validateMatchScores", () => {
  it("accepts complete bo3 match", () => {
    expect(
      validateMatchScores(
        [
          { p1: 6, p2: 4 },
          { p1: 4, p2: 6 },
          { p1: 7, p2: 5 },
        ],
        3,
        1
      )
    ).toBeNull();
  });

  it("rejects incomplete match", () => {
    expect(
      validateMatchScores([{ p1: 6, p2: 4 }], 3, 1)
    ).toContain("hace falta ganar 2 sets");
  });

  it("rejects extra set after match decided", () => {
    expect(
      validateMatchScores(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 2 },
          { p1: 6, p2: 1 },
        ],
        3,
        1
      )
    ).toContain("Sobra el set 3");
  });

  it("rejects winner mismatch", () => {
    expect(
      validateMatchScores(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 2 },
        ],
        3,
        2
      )
    ).toContain("no coincide");
  });
});

describe("isValidCompletedSet", () => {
  it("mirrors getSetValidationError", () => {
    expect(isValidCompletedSet(6, 4)).toBe(true);
    expect(isValidCompletedSet(4, 3)).toBe(false);
  });
});
