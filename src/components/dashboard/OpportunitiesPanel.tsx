"use client";

// OpportunitiesPanel — Q5 do dashboard.
// Mostra agregado de oportunidades por categoria geradas pelo agente Semente.
// KPI ESG agregado + cards por categoria com botao "Aprovar capital semente".

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fundOpportunity,
  getOpportunities,
  type OpportunitiesResponse,
} from "@/lib/api/dashboard";
import type { OpportunityAggregate } from "@/types";
import { cn } from "@/lib/utils";

const REFRESH_MS = 8_000;

export function OpportunitiesPanel() {
  const [data, setData] = useState<OpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await getOpportunities();
      setData(r);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().finally(() => {
      if (active) setLoading(false);
    });
    const t = setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  async function handleFund(ideaId: string) {
    setBusyId(ideaId);
    try {
      await fundOpportunity(ideaId);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const totals = data?.totals;
  const incomeProjection = useMemo(() => {
    // Heuristica: cada R$ 5.000 de capex = ~R$ 30k renda anual local
    if (!totals) return 0;
    return Math.round((totals.capexSuggested / 5000) * 30000);
  }, [totals]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-brand-bg p-4 text-xs">
        <Stat label="ideias avaliadas" value={totals?.ideasAnalyzed ?? 0} />
        <Stat
          label="alta-fit"
          value={totals?.highFitTotal ?? 0}
          accent="good"
        />
        <Stat
          label="capex sugerido"
          value={`R$ ${(totals?.capexSuggested ?? 0).toLocaleString("pt-BR")}`}
        />
        <Stat
          label="já financiadas"
          value={totals?.fundedCount ?? 0}
          accent="good"
        />
        {(totals?.capexSuggested ?? 0) > 0 && (
          <p className="ml-auto rounded-lg bg-emerald-50 px-3 py-1.5 font-mono text-[11px] text-emerald-800">
            🎯 KPI ESG: R$ {totals?.capexSuggested.toLocaleString("pt-BR")}{" "}
            investido = ~R$ {incomeProjection.toLocaleString("pt-BR")}
            /ano renda local projetada
          </p>
        )}
      </div>

      {loading && data === null && (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
          carregando oportunidades…
        </p>
      )}

      {!loading && data && data.aggregates.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
          🌱 Nenhuma ideia avaliada ainda. Quando cidadãos enviarem, aparecem aqui.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false}>
          {(data?.aggregates ?? []).map((a) => (
            <CategoryCard
              key={a.category}
              aggregate={a}
              busyId={busyId}
              onFund={handleFund}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CategoryCard({
  aggregate,
  busyId,
  onFund,
}: {
  aggregate: OpportunityAggregate;
  busyId: string | null;
  onFund: (id: string) => void;
}) {
  const top = aggregate.topIdeas[0];
  const fitChip =
    aggregate.highFitCount > 0
      ? "bg-emerald-100 text-emerald-800"
      : aggregate.pendingIdeasCount > 0
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800";
  const fitLabel =
    aggregate.highFitCount > 0
      ? "🟢 alta-fit"
      : aggregate.pendingIdeasCount > 0
        ? "🟡 médio-fit"
        : "—";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {aggregate.category}
          </p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {aggregate.pendingIdeasCount}{" "}
            {aggregate.pendingIdeasCount === 1
              ? "ideia avaliada"
              : "ideias avaliadas"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            fitChip
          )}
        >
          {fitLabel}
        </span>
      </header>

      {top && (
        <div className="rounded-lg bg-brand-bg p-3 text-xs text-text-primary">
          <p className="font-semibold">{top.structured.title}</p>
          <p className="mt-1 text-text-secondary">
            {top.marketAnalysis.demandSignal.evidence}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            Capex: R${" "}
            {top.structured.estimatedCapex.min.toLocaleString("pt-BR")}–
            {top.structured.estimatedCapex.max.toLocaleString("pt-BR")} ·
            payback {top.structured.estimatedPaybackMonths}m
          </p>
          {top.marketAnalysis.localContentMatch?.potential && (
            <p className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
              local content match
            </p>
          )}
        </div>
      )}

      {top && (
        <button
          type="button"
          disabled={busyId === top.id || top.status === "submitted_to_funding"}
          onClick={() => onFund(top.id)}
          className={cn(
            "flex min-h-[40px] items-center justify-center rounded-lg text-xs font-semibold transition-colors",
            top.status === "submitted_to_funding"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-brand-green text-white hover:bg-brand-green/90 disabled:opacity-50"
          )}
        >
          {top.status === "submitted_to_funding"
            ? "✓ Capital semente aprovado"
            : busyId === top.id
              ? "aprovando…"
              : "Aprovar capital semente"}
        </button>
      )}
    </motion.article>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "good";
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-base font-bold tabular-nums",
          accent === "good" ? "text-emerald-700" : "text-text-primary"
        )}
      >
        {value}
      </span>
    </div>
  );
}
