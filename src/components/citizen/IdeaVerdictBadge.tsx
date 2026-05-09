"use client";

// IdeaVerdictBadge — badge grande com cor por nivel + score destacado.
import { motion } from "framer-motion";
import type { IdeaVerdictLevel } from "@/types";
import { cn } from "@/lib/utils";

export type IdeaVerdictBadgeProps = {
  level: IdeaVerdictLevel;
  score: number;
  headline: string;
};

const VERDICT_META: Record<
  IdeaVerdictLevel,
  { emoji: string; label: string; cardClass: string; numClass: string }
> = {
  go: {
    emoji: "🟢",
    label: "VALE A PENA",
    cardClass: "border-emerald-500 bg-emerald-50",
    numClass: "text-emerald-700",
  },
  adjust: {
    emoji: "🟡",
    label: "VALE COM AJUSTES",
    cardClass: "border-amber-400 bg-amber-50",
    numClass: "text-amber-700",
  },
  pivot: {
    emoji: "🔴",
    label: "MERCADO SATURADO",
    cardClass: "border-red-400 bg-red-50",
    numClass: "text-red-700",
  },
};

export function IdeaVerdictBadge({
  level,
  score,
  headline,
}: IdeaVerdictBadgeProps) {
  const meta = VERDICT_META[level];
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={cn(
        "rounded-2xl border-2 p-5 text-center",
        meta.cardClass
      )}
    >
      <div className="flex items-baseline justify-center gap-3">
        <span className="text-2xl" aria-hidden>
          {meta.emoji}
        </span>
        <span
          className={cn(
            "font-mono text-5xl font-bold tabular-nums",
            meta.numClass
          )}
        >
          {score}
        </span>
        <span className="text-sm text-text-secondary">/ 100</span>
      </div>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-text-secondary">
        {meta.label}
      </p>
      <p
        className="mx-auto mt-3 max-w-md text-base font-semibold text-text-primary"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {headline}
      </p>
    </motion.div>
  );
}
