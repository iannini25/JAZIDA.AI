"use client";

// MarketDimensionRow — uma dimensao da analise (demanda / competicao / etc).
// Mini-bar visual de score + evidencia em texto.

import { cn } from "@/lib/utils";

export type MarketDimensionRowProps = {
  icon: string;
  label: string;
  score?: number; // 0-100
  scoreLabel?: string; // texto customizado se score nao se aplica
  evidence: string;
  intent?: "good" | "neutral" | "warn";
};

export function MarketDimensionRow({
  icon,
  label,
  score,
  scoreLabel,
  evidence,
  intent = "neutral",
}: MarketDimensionRowProps) {
  const barColor =
    intent === "good"
      ? "bg-emerald-500"
      : intent === "warn"
        ? "bg-red-500"
        : "bg-amber-500";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="text-lg" aria-hidden>
            {icon}
          </span>
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-sm font-bold tabular-nums",
            intent === "good"
              ? "text-emerald-700"
              : intent === "warn"
                ? "text-red-700"
                : "text-amber-700"
          )}
        >
          {scoreLabel ?? (typeof score === "number" ? `${score}/100` : "—")}
        </span>
      </div>
      {typeof score === "number" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn("h-full rounded-full", barColor)}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      )}
      <p className="mt-2 text-xs leading-relaxed text-text-secondary">
        {evidence}
      </p>
    </div>
  );
}
