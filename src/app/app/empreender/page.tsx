"use client";

// /app/empreender — cidadao manda ideia de negocio. Agente Semente avalia.
//
// Fluxo:
//  1) form com textarea + CTA "Analisar minha ideia"
//  2) submit -> POST /ideas -> mostra <AgentCascade> animando ~5-7s
//  3) tela de veredito com <IdeaVerdictBadge> + dimensoes + plano + financiamento

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AgentCascade } from "@/components/citizen/AgentCascade";
import { AppHeader } from "@/components/citizen/AppHeader";
import { IdeaVerdictBadge } from "@/components/citizen/IdeaVerdictBadge";
import { MarketDimensionRow } from "@/components/citizen/MarketDimensionRow";
import { NextStepCard } from "@/components/citizen/NextStepCard";
import { FundingOpportunityCard } from "@/components/citizen/FundingOpportunityCard";
import {
  listCitizens,
  seedDemo,
  submitBusinessIdea,
} from "@/lib/api/citizen";
import {
  getStoredCitizenId,
  getStoredCitizenName,
  setStoredCitizen,
} from "@/lib/citizen-storage";
import type { BusinessIdea } from "@/types";

const PLACEHOLDER = `ex: queria abrir uma padaria perto de casa, sei fazer pao
ex: tava pensando em vender vestido de noiva, sei costurar
ex: quero montar uma marmitaria pra trabalhador da Vale`;

const CASCADE_STEPS = [
  { agent: "Acolhida", description: "te ouvindo" },
  { agent: "Semente · demanda", description: "cruzando sinais da cidade" },
  { agent: "Semente · competicao", description: "vendo quem ja faz isso aqui" },
  { agent: "Semente · plano", description: "montando seu plano de acao" },
];

type ViewState = "form" | "processing" | "result" | "error";

export default function EmpreenderPageWrapper() {
  return (
    <Suspense fallback={<EmpreenderLoading />}>
      <EmpreenderPage />
    </Suspense>
  );
}

function EmpreenderLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10 text-sm text-text-secondary">
      carregando...
    </main>
  );
}

function EmpreenderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prefill") || "";

  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [citizenName, setCitizenName] = useState<string>("");
  const [text, setText] = useState<string>(prefill);
  const [view, setView] = useState<ViewState>("form");
  const [idea, setIdea] = useState<BusinessIdea | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const stored = getStoredCitizenId();
      if (stored) {
        if (!cancelled) {
          setCitizenId(stored);
          setCitizenName(getStoredCitizenName() || "");
        }
        return;
      }
      try {
        await seedDemo();
        const { citizens } = await listCitizens();
        const target =
          citizens.find((c) => c.name.toLowerCase().includes("beatriz")) ||
          citizens.find((c) => c.name.toLowerCase().includes("maria")) ||
          citizens[0];
        if (target) {
          setStoredCitizen(target.id, target.name);
          if (!cancelled) {
            setCitizenId(target.id);
            setCitizenName(target.name.split(" ")[0]);
          }
        }
      } catch (err) {
        console.error("[empreender] bootstrap falhou:", err);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(
    () =>
      citizenName ? `${citizenName}, conta a ideia.` : "Conta a ideia.",
    [citizenName]
  );

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || !citizenId) return;
    setView("processing");
    setIdea(null);
    setErrorMessage("");
    try {
      // Roda em paralelo: submit + delay minimo de 4s pra cascata terminar
      const [submitRes] = await Promise.all([
        submitBusinessIdea(citizenId, trimmed),
        new Promise((r) => setTimeout(r, 4500)),
      ]);
      setIdea(submitRes.idea);
      setView("result");
    } catch (err) {
      console.error("[empreender] erro:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Algo deu errado. Tenta de novo em um instante?"
      );
      setView("error");
    }
  }

  return (
    <>
      <AppHeader title="Empreender" back="/app" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6 pb-24">
        {view === "form" && (
          <FormView
            greeting={greeting}
            text={text}
            setText={setText}
            onSubmit={handleSubmit}
            disabled={!citizenId || !text.trim()}
          />
        )}

        {view === "processing" && (
          <ProcessingView text={text} />
        )}

        {view === "result" && idea && (
          <ResultView
            idea={idea}
            onSeeHistory={() => router.push("/app/historia")}
            onAnother={() => {
              setText("");
              setIdea(null);
              setView("form");
            }}
          />
        )}

        {view === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl" aria-hidden>
              🤔
            </span>
            <p className="text-base text-text-primary">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setView("form")}
              className="rounded-2xl bg-brand-green px-5 py-3 text-sm font-semibold text-white"
            >
              Tentar de novo
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function FormView(props: {
  greeting: string;
  text: string;
  setText: (s: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <div>
        <p className="text-sm uppercase tracking-wider text-brand-green">
          {props.greeting}
        </p>
        <h1
          className="mt-1 text-2xl font-bold leading-tight text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          💡 Sua ideia de negocio
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          A JAZIDA vai analisar se tem mercado, sem enrolacao. Demanda real da
          cidade, competicao, plano de acao.
        </p>
      </div>

      <textarea
        value={props.text}
        onChange={(e) => props.setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={6}
        className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-base text-text-primary placeholder:text-text-secondary focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
      />

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          disabled
          aria-disabled
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-text-secondary opacity-60"
          title="Em breve — gravar audio"
        >
          🎤 Mandar por voz
        </button>
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={props.disabled}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          📊 Analisar minha ideia
        </button>
      </div>

      <Link
        href="/app"
        className="self-center text-sm text-text-secondary underline-offset-2 hover:underline"
      >
        voltar pra inicio
      </Link>
    </>
  );
}

function ProcessingView({ text }: { text: string }) {
  return (
    <>
      <div>
        <p className="text-xs uppercase tracking-wider text-brand-green">
          JAZIDA ta analisando
        </p>
        <h2
          className="mt-1 text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Cruzando dados da cidade...
        </h2>
        <blockquote className="mt-3 rounded-2xl bg-brand-bg p-4 text-sm italic text-text-primary">
          “{text}”
        </blockquote>
      </div>
      <AgentCascade steps={CASCADE_STEPS} stepDelayMs={1100} />
    </>
  );
}

function ResultView(props: {
  idea: BusinessIdea;
  onSeeHistory: () => void;
  onAnother: () => void;
}) {
  const { idea } = props;
  const m = idea.marketAnalysis;

  const demandIntent = m.demandSignal.score >= 70 ? "good" : m.demandSignal.score >= 40 ? "neutral" : "warn";
  const competitionScore =
    m.competitionLevel === "none"
      ? 95
      : m.competitionLevel === "low"
        ? 75
        : m.competitionLevel === "medium"
          ? 45
          : 15;
  const competitionIntent =
    m.competitionLevel === "none" || m.competitionLevel === "low"
      ? "good"
      : m.competitionLevel === "saturated"
        ? "warn"
        : "neutral";

  const capexLabel = `R$ ${idea.structured.estimatedCapex.min.toLocaleString("pt-BR")}–${idea.structured.estimatedCapex.max.toLocaleString("pt-BR")}`;
  const paybackLabel = `${idea.structured.estimatedPaybackMonths} meses`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs uppercase tracking-wider text-brand-green">
          Sua ideia
        </p>
        <h2
          className="mt-1 text-xl font-bold leading-tight text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          “{idea.structured.title}”
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          {idea.structured.category} · {idea.structured.suggestedLegalForm} ·{" "}
          {idea.structured.targetCustomer}
        </p>
      </motion.div>

      <IdeaVerdictBadge
        level={idea.verdict.level}
        score={idea.verdict.score}
        headline={idea.verdict.headline}
      />

      <p className="rounded-xl bg-brand-bg p-4 text-sm leading-relaxed text-text-primary">
        {idea.verdict.reasoning}
      </p>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Por que vale (ou nao)
        </h3>
        <MarketDimensionRow
          icon="📈"
          label="Demanda"
          score={m.demandSignal.score}
          evidence={m.demandSignal.evidence}
          intent={demandIntent}
        />
        <MarketDimensionRow
          icon="🏪"
          label="Competicao"
          score={competitionScore}
          scoreLabel={competitionLabel(m.competitionLevel)}
          evidence={m.competitionEvidence}
          intent={competitionIntent}
        />
        <MarketDimensionRow
          icon="💰"
          label="Investimento"
          scoreLabel={capexLabel}
          evidence={`Volta em ${paybackLabel} (estimativa). Forma juridica sugerida: ${idea.structured.suggestedLegalForm}.`}
          intent="neutral"
        />
        {m.localContentMatch?.potential && (
          <MarketDimensionRow
            icon="🏗️"
            label="Local Content"
            scoreLabel="match alto"
            evidence={m.localContentMatch.description}
            intent="good"
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Seus proximos {idea.actionPlan.nextSteps.length} passos
        </h3>
        {idea.actionPlan.nextSteps.map((s, i) => (
          <NextStepCard key={s.order} step={s} index={i} />
        ))}
      </section>

      {idea.actionPlan.fundingOpportunities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Programas que cabem em voce
          </h3>
          {idea.actionPlan.fundingOpportunities.map((f, i) => (
            <FundingOpportunityCard key={i} funding={f} />
          ))}
        </section>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={props.onSeeHistory}
          className="flex min-h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-semibold text-white"
        >
          Quero seguir esse plano!
        </button>
        <button
          type="button"
          onClick={props.onAnother}
          className="text-sm text-text-secondary underline-offset-2 hover:underline"
        >
          mandar outra ideia
        </button>
      </div>
    </>
  );
}

function competitionLabel(level: BusinessIdea["marketAnalysis"]["competitionLevel"]): string {
  switch (level) {
    case "none":
      return "nenhuma";
    case "low":
      return "baixa";
    case "medium":
      return "media";
    case "saturated":
      return "saturada";
  }
}
