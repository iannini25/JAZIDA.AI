"use client";

// FundingOpportunityCard — programa de financiamento com chip de tipo.
import type { FundingOpportunity } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  FundingOpportunity["type"],
  { label: string; chip: string; emoji: string }
> = {
  grant: {
    label: "Capital semente",
    chip: "bg-emerald-100 text-emerald-800",
    emoji: "💰",
  },
  loan: {
    label: "Microcredito",
    chip: "bg-blue-100 text-blue-800",
    emoji: "🏦",
  },
  training: {
    label: "Capacitacao",
    chip: "bg-violet-100 text-violet-800",
    emoji: "🎓",
  },
};

export function FundingOpportunityCard({
  funding,
}: {
  funding: FundingOpportunity;
}) {
  const meta = TYPE_META[funding.type];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {meta.emoji}
          </span>
          <h4 className="text-sm font-semibold text-text-primary">
            {funding.name}
          </h4>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            meta.chip
          )}
        >
          {meta.label}
        </span>
      </div>
      {funding.amount && (
        <p className="mt-2 font-mono text-base font-bold tabular-nums text-brand-green">
          {funding.amount}
        </p>
      )}
      <p className="mt-1 text-xs text-text-secondary">{funding.eligibility}</p>
      {funding.contactInfo && (
        <p className="mt-1 text-[11px] text-text-secondary">
          {funding.contactInfo}
        </p>
      )}
    </div>
  );
}
