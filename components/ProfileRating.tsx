"use client";

import { useEffect, useState } from "react";

export function ProfileRating({ rating }: { rating: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const steps = 24;
    const step = rating / steps;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      if (frame >= steps) {
        setDisplay(rating);
        clearInterval(id);
      } else {
        setDisplay(Math.round(step * frame));
      }
    }, 20);
    return () => clearInterval(id);
  }, [rating]);

  return (
    <p className="mt-2 text-4xl font-black tabular-nums text-accent">{display} pts</p>
  );
}
