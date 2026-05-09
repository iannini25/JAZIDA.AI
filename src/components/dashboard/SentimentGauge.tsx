"use client";

// SentimentGauge — gauge semicircular custom em SVG.
// value: -1 a +1. Cor: vermelho (<-0.3), amarelo (-0.3..0.3), verde (>0.3).

import type { SentimentSnapshot } from "@/types";
import { cn } from "@/lib/utils";

export type SentimentGaugeProps = {
  value: number; // -1..+1
  trend: SentimentSnapshot["trend"];
  size?: number; // default 240
};

const RED = "#dc2626";
const AMBER = "#f59e0b";
const GREEN = "#047857";

function colorFor(v: number): string {
  if (v < -0.3) return RED;
  if (v > 0.3) return GREEN;
  return AMBER;
}

function trendLabel(t: SentimentSnapshot["trend"]): string {
  return t === "up" ? "↑ subindo" : t === "down" ? "↓ caindo" : "→ estavel";
}

function trendColor(t: SentimentSnapshot["trend"]): string {
  return t === "up"
    ? "text-emerald-700"
    : t === "down"
      ? "text-red-700"
      : "text-gray-600";
}

export function SentimentGauge(props: SentimentGaugeProps) {
  const size = props.size ?? 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  const strokeWidth = 16;

  // Arco semicircular: -180 a 0 graus (top half).
  // Mapeia value -1..+1 -> angulo -180..0
  const angle = -180 + ((props.value + 1) / 2) * 180;
  const angleRad = (angle * Math.PI) / 180;
  const tipX = cx + radius * Math.cos(angleRad);
  const tipY = cy + radius * Math.sin(angleRad);

  const color = colorFor(props.value);
  const display =
    props.value > 0
      ? `+${props.value.toFixed(2)}`
      : props.value.toFixed(2);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size / 2 + 28}
        viewBox={`0 0 ${size} ${size / 2 + 28}`}
        aria-label={`Indice de sentimento: ${display}, ${trendLabel(props.trend)}`}
      >
        {/* track de fundo */}
        <path
          d={describeArc(cx, cy, radius, -180, 0)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* zonas coloridas leves */}
        <path
          d={describeArc(cx, cy, radius, -180, -180 + 35 * 0.7)}
          fill="none"
          stroke={RED}
          strokeWidth={strokeWidth}
          strokeOpacity={0.18}
          strokeLinecap="round"
        />
        <path
          d={describeArc(cx, cy, radius, -180 + 35 * 0.7, -180 + 145 * 0.7)}
          fill="none"
          stroke={AMBER}
          strokeWidth={strokeWidth}
          strokeOpacity={0.18}
        />
        <path
          d={describeArc(cx, cy, radius, -180 + 145 * 0.7, 0)}
          fill="none"
          stroke={GREEN}
          strokeWidth={strokeWidth}
          strokeOpacity={0.18}
          strokeLinecap="round"
        />
        {/* arco ate o valor */}
        <path
          d={describeArc(cx, cy, radius, -180, angle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* ponta */}
        <circle cx={tipX} cy={tipY} r={9} fill={color} />
        <circle cx={tipX} cy={tipY} r={4} fill="white" />
        {/* labels nas pontas */}
        <text
          x={cx - radius - 4}
          y={cy + 28}
          fontSize="11"
          fill="#6b7280"
          textAnchor="middle"
        >
          -1
        </text>
        <text
          x={cx + radius + 4}
          y={cy + 28}
          fontSize="11"
          fill="#6b7280"
          textAnchor="middle"
        >
          +1
        </text>
      </svg>
      <div className="-mt-12 flex flex-col items-center">
        <span
          className="font-mono text-5xl font-bold tabular-nums"
          style={{ color }}
        >
          {display}
        </span>
        <span
          className={cn("text-xs font-semibold uppercase tracking-wider", trendColor(props.trend))}
        >
          {trendLabel(props.trend)}
        </span>
      </div>
    </div>
  );
}

// Helpers SVG
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  const sweep = endAngle > startAngle ? "1" : "0";
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArc,
    sweep,
    end.x,
    end.y,
  ].join(" ");
}
