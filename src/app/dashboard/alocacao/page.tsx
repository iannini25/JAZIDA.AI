"use client";

// /dashboard/alocacao — sugestão de alocação de orçamento ESG.
// Heurística client-side a partir das categorias dos sinais (queixas + talents).
//
// Cada linha mostra:
//   - Linha de investimento (categoria humanizada)
//   - % editável e R$ calculado
//   - Justificativa (quantos sinais + sentimento)
//   - **KPI alvo** que essa linha move
//   - **Condicionante linkada** (CC-XX) — fecha o claim "qual condicionante satisfaz"
//   - Ações (aprovar)

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getConditionants,
  getDashboardCitizens,
  getSentiment,
  type ConditionantsResponse,
  type DashboardCitizen,
} from "@/lib/api/dashboard";
import type { Conditionant, SentimentSnapshot } from "@/types";
import { Icon } from "@/components/ui/Icons";

const DEFAULT_BUDGET = 4_000_000;

const CATEGORY_LABELS: Record<string, string> = {
  "ar/poeira": "Mitigação de impacto ambiental",
  "mineradora-direto": "Operações & engajamento direto",
  ruido: "Mitigação de ruído / logística",
  saude: "Capacitação em saúde",
  "saude-publica": "Saúde pública & infraestrutura",
  educacao: "Educação & ensino técnico",
  "educacao-publica": "Educação pública & infraestrutura",
  comercio: "Microempreendedorismo & MEI",
  agua: "Saneamento & água",
  "arte/cultura": "Cultura & turismo local",
  tecnologia: "Capacitação em tecnologia",
  "moda/costura": "Cultura & turismo local",
  outro: "Programas gerais",
};

// KPI alvo por categoria — o que essa linha de orçamento move concretamente.
// Mostrado na coluna "→ KPI alvo" pra fechar o claim "qual KPI move".
const CATEGORY_KPI: Record<string, string> = {
  "ar/poeira":
    "Reduzir queixas de ar/poeira em -40% (90 dias) · Reduzir doenças respiratórias DataSUS em -8%",
  "mineradora-direto":
    "Reduzir tickets diretos contra a operação em -50% (180 dias)",
  ruido:
    "Restringir caminhões em horário noturno · queixas de ruído -60% (60 dias)",
  saude:
    "120 cidadãos formados em técnico de enfermagem (parceria SENAI + Hospital MH)",
  "saude-publica":
    "Tempo médio de espera em UBS -30% (90 dias) · cobertura ACS +12%",
  educacao:
    "Evasão escolar EM -15% (12 meses) · IDEB anos finais +0,4 pontos",
  "educacao-publica":
    "Reforma de 4 escolas no entorno · evasão escolar -10%",
  comercio: "25 MEIs criados via JAZIDA Marketplace · R$ 144k renda local/ano",
  agua: "Saneamento básico domiciliar +8% · queixas de água -50%",
  "arte/cultura":
    "Polo de turismo cultural · 15 artesãos formalizados · CFEM Mariana invest. permanente",
  tecnologia: "30 jovens formados em programação (Recode + SENAI)",
  "moda/costura":
    "8 costureiras formalizadas como MEI · cluster de moda festa em Mariana",
  outro: "Conforme escopo do programa selecionado",
};

type Suggestion = {
  category: string;
  label: string;
  count: number;
  weight: number;
  amount: number;
  pct: number;
  rationale: string;
  targetKpi: string;
  linkedConditionant?: Conditionant; // condicionante que esta linha satisfaz
};

export default function AlocacaoPage() {
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [sentiment, setSentiment] = useState<SentimentSnapshot | null>(null);
  const [citizens, setCitizens] = useState<DashboardCitizen[]>([]);
  const [conditionants, setConditionants] =
    useState<ConditionantsResponse | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void getSentiment().then(setSentiment).catch(() => {});
    void getDashboardCitizens().then(setCitizens).catch(() => {});
    void getConditionants({ cityId: "mariana" })
      .then(setConditionants)
      .catch(() => {});
  }, []);

  // Mapa categoria -> condicionante que cobre essa categoria
  const condByCategory = useMemo(() => {
    const map = new Map<string, Conditionant>();
    if (!conditionants) return map;
    for (const c of conditionants.conditionants) {
      for (const line of c.linkedAllocationLines) {
        // Se ja tem, prioriza condicionante mais critica (em-risco > em-prazo)
        const existing = map.get(line);
        if (
          !existing ||
          (c.status === "em-risco" && existing.status !== "em-risco") ||
          (c.status === "vencida" && existing.status !== "vencida")
        ) {
          map.set(line, c);
        }
      }
    }
    return map;
  }, [conditionants]);

  const suggestions: Suggestion[] = useMemo(() => {
    if (!sentiment) return [];

    const themes = sentiment.topThemes;
    const totalCount = themes.reduce((s, t) => s + t.count, 0) || 1;

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
            `${t.count} sinais nesta categoria · sentimento ${
              t.sentiment >= 0 ? "+" : ""
            }${t.sentiment.toFixed(2)}` +
            (t.sentiment < -0.3 ? " (alta urgência)" : ""),
          targetKpi: CATEGORY_KPI[t.label] || "Definir KPI no detalhamento",
          linkedConditionant: condByCategory.get(t.label),
        };
      })
      .sort((a, b) => b.weight - a.weight);
  }, [sentiment, budget, overrides, condByCategory]);

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

  // Quantas condicionantes do licenciamento esta alocação cobre?
  const conditionantsCovered = useMemo(() => {
    const ids = new Set<string>();
    for (const s of suggestions) {
      if (s.linkedConditionant && s.amount > 0) {
        ids.add(s.linkedConditionant.id);
      }
    }
    return ids.size;
  }, [suggestions]);

  function exportJson() {
    const payload = {
      cityId: "mariana",
      generatedAt: new Date().toISOString(),
      budget,
      adherencePct: adherence,
      conditionantsCovered,
      suggestions: suggestions.map((s) => ({
        category: s.category,
        label: s.label,
        amount: s.amount,
        pct: s.pct,
        rationale: s.rationale,
        targetKpi: s.targetKpi,
        linkedConditionant: s.linkedConditionant
          ? {
              id: s.linkedConditionant.id,
              agency: s.linkedConditionant.agency,
              status: s.linkedConditionant.status,
            }
          : null,
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
      <header className="border-b border-solo-linha bg-solo-papel-claro px-6 py-4">
        <p className="micro" style={{ color: "var(--ferro)" }}>
          Alocação ESG · Mariana, MG
        </p>
        <h1 className="display-m mt-1 text-solo-tinta" style={{ fontSize: 22 }}>
          Orçamento sugerido por demanda real
        </h1>
        <p className="body-s mt-1 max-w-3xl text-solo-tinta-suave">
          Cada linha cruza demanda comunitária (Pulsar) com KPI mensurável e
          condicionante do licenciamento. Aprovação aqui gera evidência
          auditável pro relatório anual.
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
          {/* KPI strip */}
          <section className="grid gap-4 rounded-[10px] border border-solo-linha bg-solo-papel-claro p-5 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="micro text-solo-tinta-tenue">
                orçamento total
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                className="strata-input mt-1 font-mono"
                style={{ height: 40, fontSize: 14 }}
                step={100000}
                min={0}
              />
            </label>
            <Stat
              label="aderência à demanda"
              value={`${adherence}%`}
              hint={
                adherence >= 85
                  ? "alocação bem casada com sinais"
                  : "ajustes manuais divergem da demanda"
              }
              accent={adherence >= 85 ? "good" : "warn"}
            />
            <Stat
              label="cidadãos engajados"
              value={citizens.length}
              hint={`${citizens.reduce(
                (s, c) => s + c.talentsCount + c.complaintsCount,
                0
              )} sinais coletados`}
            />
            <Stat
              label="condicionantes cobertas"
              value={
                conditionants
                  ? `${conditionantsCovered}/${conditionants.summary.total}`
                  : "—"
              }
              hint={
                conditionants?.summary.emRisco
                  ? `${conditionants.summary.emRisco} em risco no licenciamento`
                  : "todas as condicionantes em prazo"
              }
              accent={
                conditionants && conditionantsCovered === conditionants.summary.total
                  ? "good"
                  : "warn"
              }
            />
          </section>

          {/* tabela */}
          <section className="rounded-[10px] border border-solo-linha bg-solo-papel-claro overflow-hidden">
            <div
              className="grid items-center gap-3 border-b border-solo-linha px-4 py-2 text-[10px] font-semibold uppercase tracking-microlabel text-solo-tinta-tenue"
              style={{
                gridTemplateColumns:
                  "1.4fr 60px 130px 1.5fr 1.5fr 130px 100px",
              }}
            >
              <span>linha de investimento</span>
              <span className="text-right">%</span>
              <span className="text-right">R$</span>
              <span>justificativa</span>
              <span>→ KPI alvo</span>
              <span>→ condicionante</span>
              <span className="text-right">ações</span>
            </div>

            {suggestions.length === 0 && (
              <div className="px-4 py-6 body-s text-solo-tinta-tenue">
                Carregando sugestões ou sem sinais suficientes ainda.
              </div>
            )}

            {suggestions.map((s) => (
              <motion.div
                key={s.category}
                layout
                className="grid items-center gap-3 border-b border-solo-linha px-4 py-3 text-sm last:border-b-0 hover:bg-solo-papel-fundo/40"
                style={{
                  gridTemplateColumns:
                    "1.4fr 60px 130px 1.5fr 1.5fr 130px 100px",
                }}
              >
                <div>
                  <p className="font-medium text-solo-tinta">{s.label}</p>
                  <p className="caption text-solo-tinta-tenue">
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
                      const v = Math.max(
                        0,
                        Math.min(100, Number(e.target.value))
                      );
                      setOverrides((prev) => ({
                        ...prev,
                        [s.category]: v / 100,
                      }));
                    }}
                    className="h-8 w-16 rounded-md border border-solo-linha-forte bg-solo-papel-claro px-2 text-right font-mono text-xs"
                  />
                </div>
                <div className="text-right font-mono text-sm tabular-nums text-solo-tinta">
                  R$ {s.amount.toLocaleString("pt-BR")}
                </div>
                <div className="caption text-solo-tinta-suave">
                  {s.rationale}
                </div>
                <div className="caption leading-relaxed text-solo-tinta">
                  <span className="text-jazida-verde mono-s mr-1">→</span>
                  {s.targetKpi}
                </div>
                <div>
                  {s.linkedConditionant ? (
                    <ConditionantPill c={s.linkedConditionant} />
                  ) : (
                    <span className="caption text-solo-tinta-tenue">—</span>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setApproved((p) => ({ ...p, [s.category]: !p[s.category] }))
                    }
                    className={
                      approved[s.category]
                        ? "rounded-md bg-jazida-verde/10 px-3 py-1 text-[11px] font-semibold text-jazida-verde border border-jazida-verde/30"
                        : "strata-btn strata-btn-primary"
                    }
                    style={
                      approved[s.category]
                        ? undefined
                        : { height: 28, fontSize: 11, padding: "0 12px" }
                    }
                  >
                    {approved[s.category] ? "✓ aprovado" : "Aprovar"}
                  </button>
                </div>
              </motion.div>
            ))}

            <div
              className="grid items-center gap-3 border-t-2 border-solo-tinta px-4 py-4 text-sm font-semibold"
              style={{
                gridTemplateColumns:
                  "1.4fr 60px 130px 1.5fr 1.5fr 130px 100px",
              }}
            >
              <span className="micro text-solo-tinta-tenue">total alocado</span>
              <span />
              <span className="text-right font-mono tabular-nums text-jazida-verde mono-l" style={{ fontSize: 18 }}>
                R$ {totalAllocated.toLocaleString("pt-BR")}
              </span>
              <span className="caption text-solo-tinta-tenue">
                {Object.values(approved).filter(Boolean).length} de {suggestions.length} linhas aprovadas
              </span>
              <span />
              <span />
              <button
                type="button"
                onClick={exportJson}
                className="strata-btn strata-btn-outline-solo justify-self-end"
                style={{ height: 30, fontSize: 11, padding: "0 12px" }}
              >
                <Icon name="i-export" size={12} />
                Exportar
              </button>
            </div>
          </section>

          {/* footer narrativo */}
          <p className="caption mt-2 max-w-3xl text-solo-tinta-tenue">
            Cada linha aprovada gera registro com timestamp + justificativa que
            entra na trilha de evidências do{" "}
            <Link
              href="/dashboard/esg-report"
              className="font-semibold text-jazida-verde hover:underline"
            >
              relatório CSRD
            </Link>{" "}
            e satisfaz a condicionante linkada (
            <Link
              href="/dashboard/condicionantes"
              className="font-semibold text-jazida-verde hover:underline"
            >
              ver licenciamento →
            </Link>
            ).
          </p>
        </div>
      </main>
    </div>
  );
}

function ConditionantPill({ c }: { c: Conditionant }) {
  const meta =
    c.status === "vencida"
      ? {
          color: "var(--sinal-critico)",
          bg: "rgba(168,58,40,0.10)",
          border: "rgba(168,58,40,0.40)",
        }
      : c.status === "em-risco"
        ? {
            color: "var(--sinal-alerta)",
            bg: "rgba(201,133,58,0.10)",
            border: "rgba(201,133,58,0.40)",
          }
        : {
            color: "var(--jazida-verde)",
            bg: "rgba(63,128,96,0.10)",
            border: "rgba(63,128,96,0.40)",
          };
  return (
    <Link
      href="/dashboard/condicionantes"
      className="inline-flex flex-col gap-0.5 hover:opacity-80"
    >
      <span
        className="strata-chip"
        style={{
          color: meta.color,
          background: meta.bg,
          borderColor: meta.border,
          fontSize: 11,
        }}
      >
        {c.id} · {c.agency}
      </span>
      <span className="caption text-solo-tinta-tenue">
        {c.status === "em-risco" ? "em risco" : c.status === "vencida" ? "vencida" : "em prazo"}
      </span>
    </Link>
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
      ? "text-jazida-verde"
      : accent === "warn"
        ? "text-sinal-alerta"
        : "text-solo-tinta";
  return (
    <div className="flex flex-col gap-1">
      <span className="micro text-solo-tinta-tenue">{label}</span>
      <span className={`mono-l font-bold tabular-nums ${color}`} style={{ fontSize: 26 }}>
        {value}
      </span>
      {hint && <span className="caption text-solo-tinta-tenue">{hint}</span>}
    </div>
  );
}
