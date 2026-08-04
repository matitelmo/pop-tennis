"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { RatingHistoryPoint } from "@/types/database";

type Props = {
  points: RatingHistoryPoint[];
  playerName?: string;
};

const CHART_HEIGHT = 160;
const CHART_WIDTH = 320;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

export function RatingChart({ points, playerName }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const ratings = points.map((p) => p.rating);
    const minR = Math.min(...ratings) - 50;
    const maxR = Math.max(...ratings) + 50;
    const range = maxR - minR || 1;

    const innerW = CHART_WIDTH - PAD.left - PAD.right;
    const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

    const coords = points.map((p, i) => {
      const x =
        points.length === 1
          ? PAD.left + innerW / 2
          : PAD.left + (i / (points.length - 1)) * innerW;
      const y = PAD.top + innerH - ((p.rating - minR) / range) * innerH;
      return { x, y, ...p };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x} ${PAD.top + innerH} L ${coords[0].x} ${PAD.top + innerH} Z`
        : "";

    return { coords, linePath, areaPath, minR, maxR };
  }, [points]);

  if (!chart || points.length === 0) {
    return (
      <Card>
        <p className="text-center text-caption">Jugá tu primer partido para ver la evolución</p>
      </Card>
    );
  }

  const hovered = hoverIdx != null ? chart.coords[hoverIdx] : null;

  return (
    <Card>
      <h3 className="mb-3 font-bold text-white">
        Evolución{playerName ? ` — ${playerName}` : ""}
      </h3>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de evolución de puntos"
      >
        <title>Evolución de puntos en el tiempo</title>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + (CHART_HEIGHT - PAD.top - PAD.bottom) * t;
          const val = Math.round(chart.maxR - (chart.maxR - chart.minR) * t);
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={y}
                x2={CHART_WIDTH - PAD.right}
                y2={y}
                stroke="var(--border-subtle)"
              />
              <text x={4} y={y + 4} fill="#71717a" fontSize="9">
                {val}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {chart.areaPath && <path d={chart.areaPath} fill="url(#ratingArea)" />}
        <path
          d={chart.linePath}
          fill="none"
          stroke="var(--success)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {chart.coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hoverIdx === i ? 6 : 4}
            fill={hoverIdx === i ? "var(--success)" : "var(--background)"}
            stroke="var(--success)"
            strokeWidth="2"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onTouchStart={() => setHoverIdx(i)}
          />
        ))}
      </svg>
      <table className="sr-only">
        <caption>Historial de puntos</caption>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{new Date(p.date).toLocaleDateString("es-AR")}</td>
              <td>{p.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hovered && (
        <p className="mt-2 text-center text-body">
          {new Date(hovered.date).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
          })}
          {" · "}
          <span className="font-bold text-accent">{hovered.rating} pts</span>
        </p>
      )}
      {points.length === 1 && (
        <p className="mt-2 text-center text-caption">
          Punto de arranque — confirmá partidos para ver la curva
        </p>
      )}
    </Card>
  );
}
