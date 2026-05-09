"use client";

// DashboardHeader — top bar executiva. Mostra mineradora/cidade + sentimento atual + relogio live.

import { useEffect, useState } from "react";
import type { SentimentSnapshot } from "@/types";

export function DashboardHeader({
  miner,
  cityLabel,
  sentiment,
  rightSlot,
}: {
  miner: string;
  cityLabel: string;
  sentiment?: SentimentSnapshot;
  rightSlot?: React.ReactNode;
}) {
  const [now, setNow] = useState<string>(formatNow());
  useEffect(() => {
    const t = setInterval(() => setNow(formatNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  const value = sentiment?.current ?? 0;
  const display =
    value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  const trendSymbol =
    sentiment?.trend === "up" ? "↑" : sentiment?.trend === "down" ? "↓" : "→";

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-200 bg-white px-6 py-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          JAZIDA · {miner}
        </p>
        <h1 className="text-lg font-bold text-text-primary">
          {cityLabel}
        </h1>
      </div>

      {sentiment && (
        <div className="flex items-baseline gap-2 border-l border-gray-200 px-6">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary">
            sentimento
          </span>
          <span
            className="font-mono text-2xl font-bold tabular-nums"
            style={{ color: colorFor(value) }}
          >
            {display}
          </span>
          <span className="text-sm text-text-secondary">{trendSymbol}</span>
        </div>
      )}

      <div className="flex items-baseline gap-2 border-l border-gray-200 px-6">
        <span className="text-[10px] uppercase tracking-widest text-text-secondary">
          atualizado
        </span>
        <span className="font-mono text-sm tabular-nums text-text-primary">
          {now}
        </span>
      </div>

      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </header>
  );
}

function formatNow(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function colorFor(v: number): string {
  if (v < -0.3) return "#dc2626";
  if (v > 0.3) return "#047857";
  return "#f59e0b";
}
