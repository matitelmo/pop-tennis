import { describe, expect, it } from "vitest";
import {
  computeElPadre,
  computeFedeGorrisen,
  computeGaboMoreti,
  computePequenoCharles,
  computeSorpresaSauna,
  type MatchRecord,
} from "@/lib/badge-awards";

function match(partial: Partial<MatchRecord> & Pick<MatchRecord, "id">): MatchRecord {
  return {
    created_at: "2026-07-15T12:00:00Z",
    set_scores: [],
    winner_ids: [],
    loser_ids: [],
    participants: [],
    ...partial,
  };
}

describe("badge awards", () => {
  it("Pequeño Charles uses the previous closed calendar month", () => {
    const records: MatchRecord[] = [
      match({
        id: "1",
        created_at: "2026-07-10T12:00:00Z",
        participants: [{ user_id: "a", team: "winner", rating_before: 1200 }],
      }),
      match({
        id: "2",
        created_at: "2026-07-20T12:00:00Z",
        participants: [
          { user_id: "a", team: "winner", rating_before: 1200 },
          { user_id: "b", team: "winner", rating_before: 1200 },
        ],
      }),
      match({
        id: "3",
        created_at: "2026-08-02T12:00:00Z",
        participants: [{ user_id: "b", team: "winner", rating_before: 1200 }],
      }),
    ];

    expect(computePequenoCharles(records, new Date("2026-08-05T12:00:00Z"))).toEqual(["a"]);
  });

  it("Gabo Moreti counts 6-0 sets for winners", () => {
    const records: MatchRecord[] = [
      match({
        id: "1",
        winner_ids: ["a"],
        set_scores: [
          { p1: 6, p2: 0 },
          { p1: 6, p2: 0 },
        ],
      }),
      match({
        id: "2",
        winner_ids: ["b"],
        set_scores: [{ p1: 6, p2: 0 }],
      }),
    ];

    expect(computeGaboMoreti(records)).toEqual(["a"]);
  });

  it("El Padre goes to whoever dominated one rival the most", () => {
    const records: MatchRecord[] = [
      match({ id: "1", winner_ids: ["a"], loser_ids: ["b"] }),
      match({ id: "2", winner_ids: ["a"], loser_ids: ["b"] }),
      match({ id: "3", winner_ids: ["a"], loser_ids: ["b"] }),
      match({ id: "4", winner_ids: ["c"], loser_ids: ["b"] }),
      match({ id: "5", winner_ids: ["c"], loser_ids: ["b"] }),
      match({ id: "6", winner_ids: ["c"], loser_ids: ["b"] }),
      match({ id: "7", winner_ids: ["c"], loser_ids: ["b"] }),
    ];

    expect(computeElPadre(records)).toEqual(["c"]);
  });

  it("Fede Gorrisen counts Friday matches", () => {
    const records: MatchRecord[] = [
      match({
        id: "1",
        created_at: "2026-07-03T12:00:00Z",
        participants: [{ user_id: "a", team: "winner", rating_before: 1200 }],
      }),
      match({
        id: "2",
        created_at: "2026-07-04T12:00:00Z",
        participants: [{ user_id: "b", team: "winner", rating_before: 1200 }],
      }),
      match({
        id: "3",
        created_at: "2026-07-10T12:00:00Z",
        participants: [{ user_id: "a", team: "winner", rating_before: 1200 }],
      }),
    ];

    expect(computeFedeGorrisen(records)).toEqual(["a"]);
  });

  it("Sorpresa en el Sauna tracks the biggest rating upset", () => {
    const records: MatchRecord[] = [
      match({
        id: "1",
        participants: [
          { user_id: "a", team: "winner", rating_before: 1200 },
          { user_id: "b", team: "loser", rating_before: 1500 },
        ],
      }),
      match({
        id: "2",
        participants: [
          { user_id: "c", team: "winner", rating_before: 900 },
          { user_id: "d", team: "loser", rating_before: 1800 },
        ],
      }),
    ];

    expect(computeSorpresaSauna(records)).toEqual(["c"]);
  });
});
