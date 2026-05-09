"use client";

// MatchCard Strata — card editorial de resultado da Bussola.
// Microlabel numerado + tipo + afinidade %. Sem emoji. Hairline borders.

import type { BussolaMatch } from "@/types";
import { Icon, type IconName } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export type MatchCardProps = {
  match: BussolaMatch;
  index?: number;
  onSelect?: (match: BussolaMatch) => void;
  selected?: boolean;
};

const TYPE_META: Record<
  BussolaMatch["type"],
  { icon: IconName; label: string; mineral: string }
> = {
  course: { icon: "i-caderno", label: "Curso", mineral: "var(--ocre)" },
  job: { icon: "i-caixa", label: "Vaga", mineral: "var(--cobre)" },
  entrepreneurship: { icon: "i-broto", label: "Empreender", mineral: "var(--ferro)" },
};

export function MatchCard(props: MatchCardProps) {
  const meta = TYPE_META[props.match.type];
  const fitPct = Math.round(props.match.fitScore * 100);
  const orderLabel = String((props.index ?? 0) + 1).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={() => props.onSelect?.(props.match)}
      className={cn(
        "flex w-full flex-col gap-3 rounded-[10px] border bg-solo-papel-claro p-5 text-left transition-all duration-200 ease-strata",
        "hover:border-jazida-verde hover:bg-solo-papel",
        props.selected
          ? "border-jazida-verde bg-solo-papel"
          : "border-solo-linha"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="micro" style={{ color: "var(--ferro)" }}>
          § {orderLabel} · {meta.label} — {fitPct}% afinidade
        </div>
        <span style={{ color: meta.mineral }}>
          <Icon name={meta.icon} size={20} />
        </span>
      </div>

      <h3
        className="display-s text-solo-tinta"
        style={{ fontSize: 22 }}
      >
        {props.match.title}
      </h3>

      <p className="body-strata text-solo-tinta-suave">
        {props.match.description}
      </p>

      <div className="mt-1 h-px bg-solo-linha" style={{ width: 32 }} />

      <div className="flex flex-wrap gap-3 text-[11px] text-solo-tinta-tenue">
        {props.match.duration && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="i-ampul" size={12} /> {props.match.duration}
          </span>
        )}
        {props.match.cost && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="i-barra" size={12} /> {props.match.cost}
          </span>
        )}
      </div>

      <span
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium",
          props.selected ? "text-jazida-verde" : "text-jazida-verde"
        )}
      >
        {props.selected ? "Selecionado" : "Quero esse caminho"}
        <Icon name="i-arr" size={14} />
      </span>
    </button>
  );
}
