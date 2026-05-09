"use client";

// MatchCard — card visual pra cada resultado da Bussola.
// course=azul/livro · job=verde/maleta · entrepreneurship=ouro/foguete

import { motion } from "framer-motion";
import type { BussolaMatch } from "@/types";
import { cn } from "@/lib/utils";

export type MatchCardProps = {
  match: BussolaMatch;
  index?: number;
  onSelect?: (match: BussolaMatch) => void;
  selected?: boolean;
};

const TYPE_META: Record<
  BussolaMatch["type"],
  { icon: string; label: string; chipClass: string }
> = {
  course: {
    icon: "📚",
    label: "Curso",
    chipClass: "bg-blue-100 text-blue-800",
  },
  job: {
    icon: "💼",
    label: "Vaga",
    chipClass: "bg-emerald-100 text-emerald-800",
  },
  entrepreneurship: {
    icon: "🚀",
    label: "Empreender",
    chipClass: "bg-amber-100 text-amber-800",
  },
};

export function MatchCard(props: MatchCardProps) {
  const meta = TYPE_META[props.match.type];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (props.index ?? 0) * 0.12 }}
      onClick={() => props.onSelect?.(props.match)}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all",
        "hover:border-brand-green hover:shadow-md",
        props.selected
          ? "border-brand-green bg-brand-green-light/10 shadow-md"
          : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {meta.icon}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                meta.chipClass
              )}
            >
              {meta.label}
            </span>
            <span className="text-xs text-text-secondary">
              compatibilidade {Math.round(props.match.fitScore * 100)}%
            </span>
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug text-text-primary">
            {props.match.title}
          </h3>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-text-primary">
        {props.match.description}
      </p>
      {(props.match.duration || props.match.cost) && (
        <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
          {props.match.duration && (
            <span className="rounded-md bg-gray-100 px-2 py-1">
              ⏱️ {props.match.duration}
            </span>
          )}
          {props.match.cost && (
            <span className="rounded-md bg-gray-100 px-2 py-1">
              💰 {props.match.cost}
            </span>
          )}
        </div>
      )}
      <span
        className={cn(
          "mt-1 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
          props.selected
            ? "bg-brand-green text-white"
            : "bg-brand-bg text-brand-green group-hover:bg-brand-green group-hover:text-white"
        )}
      >
        {props.selected ? "Selecionado ✓" : "Quero esse caminho"}
      </span>
    </motion.button>
  );
}
