"use client";

// DashboardHeader Strata Solo — top bar clara. Crumbs editorial + sentimento mono + relógio.

import { useEffect, useState } from "react";
import type { SentimentSnapshot } from "@/types";
import { Icon } from "@/components/ui/Icons";

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
  const display = value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  const trendSymbol =
    sentiment?.trend === "up" ? "↑" : sentiment?.trend === "down" ? "↓" : "→";
  const sentimentColor =
    value > 0.3
      ? "var(--jazida-verde-vivo)"
      : value < -0.3
        ? "var(--sinal-critico)"
        : "var(--sinal-atencao)";

  return (
    <header className="border-b border-solo-linha bg-solo-papel-claro">
      <div className="flex h-14 items-center gap-4 px-8">
        <div className="mono-s flex items-center gap-2 text-solo-tinta-tenue">
          <span>operação</span>
          <Icon name="i-chev" size={11} />
          <span>{cityLabel.toLowerCase()}</span>
          <Icon name="i-chev" size={11} />
          <span className="text-solo-tinta">visão geral</span>
        </div>
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-8 py-5">
        <div>
          <p className="micro" style={{ color: "var(--ferro)" }}>
            JAZIDA · {miner}
          </p>
          <h1 className="display-m mt-1 text-solo-tinta" style={{ fontSize: 22 }}>
            {cityLabel}
          </h1>
        </div>

        {sentiment && (
          <div className="flex items-baseline gap-2 border-l border-solo-linha-forte pl-8">
            <span className="micro text-solo-tinta-tenue">sentimento</span>
            <span
              className="mono-l"
              style={{ color: sentimentColor, fontSize: 22 }}
            >
              {display}
            </span>
            <span className="body-s text-solo-tinta-suave">{trendSymbol}</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 border-l border-solo-linha-forte pl-8">
          <span className="micro text-solo-tinta-tenue">atualizado</span>
          <span className="mono-s text-solo-tinta">{now}</span>
        </div>
      </div>
    </header>
  );
}

function formatNow(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
