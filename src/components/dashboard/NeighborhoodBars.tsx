"use client";

// NeighborhoodBars — lista de bairros com mini-barra horizontal por sentimento.
// Sentimento varia -1..+1; barra centralizada em 0.

import type { SentimentSnapshot } from "@/types";

export function NeighborhoodBars({
  data,
}: {
  data: SentimentSnapshot["byNeighborhood"];
}) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-text-secondary">Sem sinais por bairro ainda.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((n) => (
        <li
          key={n.name}
          className="grid grid-cols-[110px_1fr_60px] items-center gap-3 text-sm"
        >
          <span className="truncate font-medium text-text-primary">
            {n.name}
          </span>
          <Bar value={n.sentiment} />
          <span className="font-mono text-xs tabular-nums text-text-secondary">
            {formatValue(n.sentiment)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatValue(v: number): string {
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
}

function Bar({ value }: { value: number }) {
  // Barra de 100% width, centralizada em 50%. Valor positivo cresce a direita,
  // negativo a esquerda.
  const half = 50;
  const fillPct = Math.min(50, Math.abs(value) * 50);
  const positive = value >= 0;
  const color =
    value > 0.3
      ? "bg-emerald-600"
      : value < -0.3
        ? "bg-red-600"
        : "bg-amber-500";
  return (
    <div className="relative h-2 w-full rounded-full bg-gray-100">
      <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300" />
      <div
        className={`absolute top-0 h-full rounded-full ${color}`}
        style={{
          width: `${fillPct}%`,
          left: positive ? `${half}%` : `${half - fillPct}%`,
        }}
      />
    </div>
  );
}
