import { DECAY_GRACE_DAYS, DECAY_POINTS_PER_WEEK } from "@/lib/constants";

export type DecayResult = {
  previousRating: number;
  newRating: number;
  pointsDeducted: number;
};

export function calculateDecay(params: {
  rating: number;
  baseRating: number;
  lastMatchAt: Date;
  lastDecayAt: Date | null;
  now?: Date;
}): DecayResult | null {
  const now = params.now ?? new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInactive = Math.floor(
    (now.getTime() - params.lastMatchAt.getTime()) / msPerDay
  );

  if (daysInactive <= DECAY_GRACE_DAYS) return null;

  const totalWeeksOfPenalty =
    Math.floor((daysInactive - DECAY_GRACE_DAYS) / 7) + 1;
  const targetRating = Math.max(
    params.baseRating,
    params.rating - totalWeeksOfPenalty * DECAY_POINTS_PER_WEEK
  );

  if (targetRating >= params.rating) return null;

  return {
    previousRating: params.rating,
    newRating: targetRating,
    pointsDeducted: params.rating - targetRating,
  };
}
