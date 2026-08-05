import { describe, expect, it } from "vitest";
import { calculateDecay } from "@/lib/decay";
import { DECAY_GRACE_DAYS, DECAY_POINTS_PER_WEEK, MIN_RATING } from "@/lib/constants";

const baseDate = new Date("2026-01-01T12:00:00Z");

function daysLater(days: number): Date {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

describe("calculateDecay", () => {
  it("does not decay within grace period", () => {
    const result = calculateDecay({
      rating: 1600,
      lastMatchAt: baseDate,
      lastDecayAt: null,
      now: daysLater(DECAY_GRACE_DAYS),
    });
    expect(result).toBeNull();
  });

  it("decays below starting rating down to global floor", () => {
    const result = calculateDecay({
      rating: 800,
      lastMatchAt: baseDate,
      lastDecayAt: null,
      now: daysLater(DECAY_GRACE_DAYS + 1),
    });

    expect(result).not.toBeNull();
    expect(result!.newRating).toBe(800 - DECAY_POINTS_PER_WEEK);
    expect(result!.newRating).toBeLessThan(800);
  });

  it("never drops below 600 points", () => {
    const result = calculateDecay({
      rating: 650,
      lastMatchAt: baseDate,
      lastDecayAt: null,
      now: daysLater(DECAY_GRACE_DAYS + 21),
    });

    expect(result).not.toBeNull();
    expect(result!.newRating).toBe(MIN_RATING);
    expect(result!.pointsDeducted).toBe(50);
  });

  it("returns null when already at minimum rating", () => {
    const result = calculateDecay({
      rating: MIN_RATING,
      lastMatchAt: baseDate,
      lastDecayAt: null,
      now: daysLater(DECAY_GRACE_DAYS + 28),
    });

    expect(result).toBeNull();
  });
});
