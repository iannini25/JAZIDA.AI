"use client";

// MatchApprovalPanel — painel onde funcionarios aprovam/rejeitam matches da Bussola.
// So matches pendentes aparecem no topo.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import type { BussolaMatch, MatchApprovalStatus, TalentEntry } from "@/types";

type EnrichedTalent = TalentEntry & {
  citizenName: string;
  citizenNeighborhood: string;
};

type MatchesResponse = {
  talents: EnrichedTalent[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

export function MatchApprovalPanel({ className }: { className?: string }) {
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function fetchMatches() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/dashboard/matches", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatches();
    const t = setInterval(fetchMatches, 8000);
    return () => clearInterval(t);
  }, []);

  async function handleAction(talentId: string, status: MatchApprovalStatus) {
    const token = getAuthToken();
    if (!token) return;
    setActionBusy(talentId);
    try {
      await fetch("/api/dashboard/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ talentId, status }),
      });
      await fetchMatches();
    } catch {
    } finally {
      setActionBusy(null);
    }
  }

  const filtered = data?.talents.filter((t) => {
    const s = t.matchApprovalStatus || "pending";
    if (filter === "all") return true;
    return s === filter;
  }) ?? [];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
            Aprovacao de recomendacoes
          </h3>
          {data && (
            <div className="flex gap-2 text-[10px]">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                {data.pendingCount} pendentes
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                {data.approvedCount} aprovadas
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
                filter === f
                  ? "bg-brand-green text-white"
                  : "text-text-secondary hover:bg-gray-100"
              )}
            >
              {f === "all" ? "todas" : f === "pending" ? "pendentes" : f === "approved" ? "aprovadas" : "rejeitadas"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
          carregando...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
          Nenhuma recomendacao {filter === "all" ? "" : filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : "rejeitada"}.
        </div>
      )}

      <AnimatePresence initial={false}>
        {filtered.map((talent) => {
          const status = talent.matchApprovalStatus || "pending";
          return (
            <motion.div
              key={talent.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={cn(
                "rounded-xl border p-4",
                status === "pending"
                  ? "border-amber-200 bg-amber-50/50"
                  : status === "approved"
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-red-200 bg-red-50/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">
                      {talent.citizenName}
                    </span>
                    <span>. {talent.citizenNeighborhood}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                      )}
                    >
                      {status === "pending" ? "pendente" : status === "approved" ? "aprovada" : "rejeitada"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-primary">
                    "{talent.rawInput}"
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Categoria: <strong>{talent.structured.label}</strong> ({talent.structured.category}) . Confianca {Math.round(talent.structured.confidence * 100)}%
                  </p>

                  {/* Matches */}
                  {talent.matches && talent.matches.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {talent.matches.map((m, i) => (
                        <MatchMini key={i} match={m} />
                      ))}
                    </div>
                  )}
                </div>

                {status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={actionBusy === talent.id}
                      onClick={() => handleAction(talent.id, "approved")}
                      className="rounded-md bg-brand-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy === talent.id}
                      onClick={() => handleAction(talent.id, "rejected")}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}

                {status !== "pending" && talent.matchApprovedBy && (
                  <span className="text-[10px] text-text-secondary">
                    por {talent.matchApprovedBy}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function MatchMini({ match }: { match: BussolaMatch }) {
  const typeLabel = match.type === "course" ? "📚 Curso" : match.type === "job" ? "💼 Vaga" : "🚀 Empreender";
  return (
    <div className="flex items-center gap-2 rounded-md bg-white/80 px-2 py-1 text-xs">
      <span>{typeLabel}</span>
      <span className="flex-1 font-medium text-text-primary">{match.title}</span>
      <span className="text-text-secondary">{Math.round(match.fitScore * 100)}%</span>
    </div>
  );
}
