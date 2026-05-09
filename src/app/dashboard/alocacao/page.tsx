"use client";

// /dashboard/alocacao — sugestao de alocacao de orcamento ESG.
// Heuristica client-side a partir das categorias dos sinais (queixas + talents).

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  getDashboardCitizens,
  getSentiment,
  type DashboardCitizen,
} from "@/lib/api/dashboard";
import type { SentimentSnapshot } from "@/types";

const DEFAULT_BUDGET = 4_000_000;

const CATEGORY_LABELS: Record<string, string> = {
  "ar/poeira": "Mitigacao de impacto ambiental",
  "mineradora-direto": "Operacoes & engajamento direto",
  ruido: "Mitigacao de ruido / logistica",
  saude: "Capacitacao em saude",
  "saude-publica": "Saude publica & infraestrutura",
  educacao: "Educacao & ensino tecnico",
  "educacao-publica": "Educacao publica & infraestrutura",
  comercio: "Microempreendedorismo & MEI",
  agua: "Saneamento & agua",
  "arte/cultura": "Cultura & turismo local",
  tecnologia: "Capacitacao em tecnologia",
  outro: "Programas gerais",
};

type Suggestion = {
  category: string;
  label: string;
  count: number;
  weight: number; // 0..1
  amount: number;
  pct: number;
  rationale: string;
};

export default function AlocacaoPage() {
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [sentiment, setSentiment] = useState<SentimentSnapshot | null>(null);
  const [citizens, setCitizens] = useState<DashboardCitizen[]>([]);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    void getSentiment().then(setSentiment).catch(() => {});
    void getDashboardCitizens().then(setCitizens).catch(() => {});
  }, []);

  const suggestions: Suggestion[] = useMemo(() => {
    if (!sentiment) return [];

    const themes = sentiment.topThemes;
    const totalCount = themes.reduce((s, t) => s + t.count, 0) || 1;

    // Peso = count normalizado * (1 + intensidade negativa). Tema mais negativo
    // recebe boost.
    const weighted = themes.map((t) => {
      const negativeBoost = t.sentiment < 0 ? 1 + Math.abs(t.sentiment) : 1;
      const score = (t.count / totalCount) * negativeBoost;
      return { ...t, score };
    });
    const totalScore = weighted.reduce((s, t) => s + t.score, 0) || 1;

    return weighted
      .map((t) => {
        const baseWeight = t.score / totalScore;
        const override = overrides[t.label];
        const weight = override !== undefined ? override : baseWeight;
        const pct = Math.round(weight * 100);
        const amount = Math.round(budget * weight);
        return {
          category: t.label,
          label: CATEGORY_LABELS[t.label] || t.label,
          count: t.count,
          weight,
          amount,
          pct,
          rationale:
            `${t.count} sinais nesta categoria · sentimento ${t.sentiment >= 0 ? "+" : ""}${t.sentiment.toFixed(2)}` +
            (t.sentiment < -0.3 ? " (alta urgencia)" : ""),
        };
      })
      .sort((a, b) => b.weight - a.weight);
  }, [sentiment, budget, overrides]);

  const totalAllocated = suggestions.reduce((s, x) => s + x.amount, 0);
  const adherence = useMemo(() => {
    if (!sentiment) return 100;
    const themes = sentiment.topThemes;
    if (themes.length === 0) return 100;
    const totalCount = themes.reduce((s, t) => s + t.count, 0) || 1;
    let score = 0;
    for (const sgn of suggestions) {
      const theme = themes.find((t) => t.label === sgn.category);
      if (!theme) continue;
      const ideal = theme.count / totalCount;
      const drift = Math.abs(sgn.weight - ideal);
      score += Math.max(0, 1 - drift * 2);
    }
    return Math.round((score / themes.length) * 100);
  }, [suggestions, sentiment]);

  function exportJson() {
    const payload = {
      cityId: "mariana",
      generatedAt: new Date().toISOString(),
      budget,
      adherencePct: adherence,
      suggestions: suggestions.map((s) => ({
        category: s.category,
        label: s.label,
        amount: s.amount,
        pct: s.pct,
        rationale: s.rationale,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `jazida-alocacao-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(u);
  }

  return (
    <div className="flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          Alocacao ESG
        </p>
        <h1 className="text-lg font-bold text-text-primary">
          Orcamento sugerido por demanda real
        </h1>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
          <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                orcamento total
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                className="h-10 rounded-lg border border-gray-200 px-3 font-mono tabular-nums text-text-primary focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                step="100000"
                min={0}
              />
            </label>
            <Stat
              label="aderencia a demanda"
              value={`${adherence}%`}
              hint={
                adherence >= 85
                  ? "alocacao bem casada com sinais"
                  : "ajustes manuais divergem da demanda"
              }
              accent={adherence >= 85 ? "good" : "warn"}
            />
            <Stat
              label="cidadaos engajados"
              value={citizens.length}
              hint={`${citizens.reduce((s, c) => s + c.talentsCount + c.complaintsCount, 0)} sinais coletados`}
            />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="grid grid-cols-[1.4fr_60px_120px_2fr_120px] gap-3 border-b border-gray-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              <span>linha de investimento</span>
              <span className="text-right">%</span>
              <span className="text-right">R$</span>
              <span>justificativa</span>
              <span className="text-right">acoes</span>
            </div>
            {suggestions.length === 0 && (
              <div className="px-4 py-6 text-sm text-text-secondary">
                Carregando sugestoes ou sem sinais suficientes ainda.
              </div>
            )}
            {suggestions.map((s) => (
              <motion.div
                key={s.category}
                layout
                className="grid grid-cols-[1.4fr_60px_120px_2fr_120px] items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-text-primary">{s.label}</p>
                  <p className="text-[11px] text-text-secondary">
                    categoria: <code>{s.category}</code>
                  </p>
                </div>
                <div className="text-right">
                  <input
                    type="number"
                    value={s.pct}
                    min={0}
                    max={100}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(100, Number(e.target.value)));
                      setOverrides((prev) => ({
                        ...prev,
                        [s.category]: v / 100,
                      }));
                    }}
                    className="h-8 w-14 rounded-md border border-gray-200 px-2 text-right font-mono text-xs"
                  />
                </div>
                <div className="text-right font-mono text-sm tabular-nums text-text-primary">
                  R$ {s.amount.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-text-secondary">{s.rationale}</div>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="rounded-md bg-brand-green px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    Aprovar
                  </button>
                </div>
              </motion.div>
            ))}
            <div className="grid grid-cols-[1.4fr_60px_120px_2fr_120px] gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold">
              <span className="uppercase tracking-wider text-text-secondary text-[11px]">
                total alocado
              </span>
              <span />
              <span className="text-right font-mono tabular-nums text-text-primary">
                R$ {totalAllocated.toLocaleString("pt-BR")}
              </span>
              <span />
              <button
                type="button"
                onClick={exportJson}
                className="justify-self-end rounded-md border border-gray-200 px-3 py-1 text-[11px] font-semibold text-text-primary hover:bg-gray-50"
              >
                Exportar JSON
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "good" | "warn";
}) {
  const color =
    accent === "good"
      ? "text-emerald-700"
      : accent === "warn"
        ? "text-amber-700"
        : "text-text-primary";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <span className={`font-mono text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </span>
      {hint && <span className="text-[11px] text-text-secondary">{hint}</span>}
    </div>
  );
}
