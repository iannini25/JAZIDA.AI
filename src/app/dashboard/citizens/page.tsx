"use client";

// /dashboard/citizens — lista de cidadaos (anonimizada) + drawer com timeline.

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { CitizenRow } from "@/components/dashboard/CitizenRow";
import {
  approveReplica,
  getCitizenHistory,
  getDashboardCitizens,
  type DashboardCitizen,
} from "@/lib/api/dashboard";
import type { CitizenHistory, HistoryItem } from "@/types";

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<DashboardCitizen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<DashboardCitizen | null>(null);
  const [history, setHistory] = useState<CitizenHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("");
  const [batchBusy, setBatchBusy] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDashboardCitizens()
      .then((data) => {
        if (active) setCitizens(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setHistoryLoading(true);
    getCitizenHistory(selected.id)
      .then((h) => {
        if (active) setHistory(h);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return citizens;
    const q = filter.toLowerCase();
    return citizens.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.neighborhood || "").toLowerCase().includes(q) ||
        (c.occupation || "").toLowerCase().includes(q)
    );
  }, [citizens, filter]);

  async function approveAll() {
    if (citizens.length === 0) return;
    setBatchBusy(true);
    setBatchResult(null);
    const results = await Promise.allSettled(
      citizens.slice(0, 5).map((c) =>
        approveReplica({
          citizenId: c.id,
          trigger: "manual",
          approvedBy: "diretoria-sustentabilidade",
        })
      )
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    setBatchBusy(false);
    setBatchResult(`${ok}/${results.length} réplicas disparadas`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-secondary">
            Base anonimizada
          </p>
          <h1 className="text-lg font-bold text-text-primary">
            Cidadãos · {citizens.length}
          </h1>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filtrar nome, bairro ou ocupação"
          className="ml-auto h-9 w-72 rounded-lg border border-gray-200 px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
        />
        <button
          type="button"
          onClick={approveAll}
          disabled={batchBusy || citizens.length === 0}
          className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {batchBusy ? "disparando…" : "Aprovar respostas pendentes"}
        </button>
      </header>

      <main className="flex flex-1 gap-4 px-6 py-6">
        <section className="flex-1 rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-[1.2fr_1fr_60px_60px_70px] gap-3 border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            <span>nome / ocupacao</span>
            <span>bairro</span>
            <span className="text-center">tal</span>
            <span className="text-center">vz</span>
            <span className="text-right">criado</span>
          </div>
          {loading && (
            <div className="p-6 text-sm text-text-secondary">carregando…</div>
          )}
          {!loading &&
            filtered.map((c) => (
              <CitizenRow
                key={c.id}
                citizen={c}
                active={selected?.id === c.id}
                onClick={() => setSelected(c)}
              />
            ))}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-sm text-text-secondary">
              nenhum cidadão no filtro.
            </div>
          )}
          {batchResult && (
            <div className="border-t border-gray-100 px-3 py-2 text-xs text-text-secondary">
              {batchResult}
            </div>
          )}
        </section>

        <AnimatePresence>
          {selected && (
            <motion.aside
              key={selected.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className="hidden w-[420px] shrink-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 lg:flex"
            >
              <header className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                    Detalhe
                  </p>
                  <h2 className="text-lg font-bold text-text-primary">
                    {selected.name}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {selected.occupation || "—"} ·{" "}
                    {selected.neighborhood || "—"} · {selected.cityId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </header>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-brand-bg p-3 text-center text-xs">
                <Stat label="talentos" value={selected.talentsCount} />
                <Stat label="vozes" value={selected.complaintsCount} />
                <Stat
                  label="desde"
                  value={format(new Date(selected.createdAt), "dd/MM", {
                    locale: ptBR,
                  })}
                />
              </div>

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Timeline
              </p>
              <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto pr-1">
                {historyLoading && (
                  <p className="text-xs text-text-secondary">carregando…</p>
                )}
                {!historyLoading && history && history.items.length === 0 && (
                  <p className="text-xs text-text-secondary">
                    Sem interações ainda.
                  </p>
                )}
                {history?.items.map((item, i) => (
                  <TimelineRow key={i} item={item} />
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="font-mono text-base font-bold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-text-secondary">
        {label}
      </p>
    </div>
  );
}

function TimelineRow({ item }: { item: HistoryItem }) {
  if (item.kind === "talent") {
    const t = item.data;
    return (
      <div className="rounded-md border border-gray-100 p-2 text-xs">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-secondary">
          <span>🎯 talento</span>
          <span>{format(new Date(t.createdAt), "dd/MM HH:mm")}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-text-primary">“{t.rawInput}”</p>
        <p className="mt-1 text-[10px] text-text-secondary">
          {t.structured.label} · {t.structured.category} · {t.matches?.length ?? 0} matches
        </p>
      </div>
    );
  }
  if (item.kind === "complaint") {
    const c = item.data;
    return (
      <div className="rounded-md border border-gray-100 p-2 text-xs">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-secondary">
          <span>{c.type === "suggestion" ? "💡 sugestao" : "📢 queixa"}</span>
          <span>{format(new Date(c.createdAt), "dd/MM HH:mm")}</span>
          <span className="ml-auto font-mono">{c.protocolNumber}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-text-primary">“{c.rawInput}”</p>
        <p className="mt-1 text-[10px] text-text-secondary">
          {c.classification.category} · urgencia {c.classification.urgency}
        </p>
      </div>
    );
  }
  if (item.kind === "idea") {
    const i = item.data;
    const verdictChip =
      i.verdict.level === "go"
        ? "bg-emerald-100 text-emerald-800"
        : i.verdict.level === "adjust"
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-800";
    const verdictEmoji =
      i.verdict.level === "go"
        ? "🟢"
        : i.verdict.level === "adjust"
          ? "🟡"
          : "🔴";
    return (
      <div className="rounded-md border border-lime-100 bg-lime-50/40 p-2 text-xs">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-lime-700">
          <span>🌱 ideia</span>
          <span>{format(new Date(i.createdAt), "dd/MM HH:mm")}</span>
          <span
            className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${verdictChip}`}
          >
            {verdictEmoji} {i.verdict.score}/100
          </span>
        </div>
        <p className="mt-1 font-semibold text-text-primary">
          {i.structured.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[10px] text-text-secondary">
          {i.verdict.headline}
        </p>
      </div>
    );
  }
  // replica
  const r = item.data;
  return (
    <div className="rounded-md border border-emerald-100 bg-emerald-50/40 p-2 text-xs">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-700">
        <span>💬 replica</span>
        <span>{format(new Date(r.createdAt), "dd/MM HH:mm")}</span>
      </div>
      <p className="mt-1 line-clamp-3 text-text-primary">{r.message}</p>
    </div>
  );
}
