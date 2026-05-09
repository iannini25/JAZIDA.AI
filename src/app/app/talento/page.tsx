"use client";

// /app/talento — tela onde o cidadao manda talento/aspiracao.
//
// Fluxo:
//  1) form: pergunta + textarea + botoes (voz / texto)
//  2) submit -> POST /talents -> mostra <AgentCascade> animando
//  3) polling em /talents ate matches aparecerem
//  4) renderiza <MatchCard /> x N

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AgentCascade } from "@/components/citizen/AgentCascade";
import { MatchCard } from "@/components/citizen/MatchCard";
import { AppHeader } from "@/components/citizen/AppHeader";
import {
  addTalent,
  pollForMatches,
  seedDemo,
  listCitizens,
} from "@/lib/api/citizen";
import {
  getStoredCitizenId,
  getStoredCitizenName,
  setStoredCitizen,
} from "@/lib/citizen-storage";
import type { BussolaMatch, TalentEntry } from "@/types";

type ViewState = "form" | "processing" | "matches" | "error";

const PLACEHOLDER = `ex: queria estudar enfermagem
ex: sei costurar vestido de noiva ha 30 anos
ex: quero abrir uma padaria no bairro`;

const CASCADE_STEPS = [
  { agent: "Acolhida", description: "te ouvindo de verdade" },
  { agent: "Talento", description: "entendendo o que voce quer" },
  { agent: "Bussola", description: "buscando caminhos pra voce" },
];

export default function TalentoPageWrapper() {
  return (
    <Suspense fallback={<TalentoLoading />}>
      <TalentoPage />
    </Suspense>
  );
}

function TalentoLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10 text-sm text-text-secondary">
      carregando...
    </main>
  );
}

function TalentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prefill") || "";

  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [citizenName, setCitizenName] = useState<string>("");
  const [text, setText] = useState<string>(prefill);
  const [view, setView] = useState<ViewState>("form");
  const [matches, setMatches] = useState<BussolaMatch[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Bootstrap: pega ID do localStorage; se nao tiver, tenta achar Maria via dashboard
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
      // Sem cidadao no localStorage — tenta usar Maria do seed
      try {
        await seedDemo();
        const { citizens } = await listCitizens();
        const maria =
          citizens.find((c) => c.name.toLowerCase().includes("maria")) ||
          citizens[0];
        if (maria) {
          setStoredCitizen(maria.id, maria.name);
          if (!cancelled) {
            setCitizenId(maria.id);
            setCitizenName(maria.name.split(" ")[0]);
          }
        }
      } catch (err) {
        console.error("[talento] bootstrap falhou:", err);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(
    () => (citizenName ? `Bora, ${citizenName}!` : "Bora?"),
    [citizenName]
  );

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || !citizenId) return;
    setView("processing");
    setMatches([]);
    setErrorMessage("");
    try {
      const { talentId } = await addTalent(citizenId, trimmed);
      const final: TalentEntry = await pollForMatches(citizenId, talentId);
      setMatches(final.matches ?? []);
      setView("matches");
    } catch (err) {
      console.error("[talento] erro:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Algo deu errado. Tenta de novo em um instante?"
      );
      setView("error");
    }
  }

  function handleSelectMatch(m: BussolaMatch) {
    setSelectedTitle(m.title);
    // Em producao, registra interesse via endpoint dedicado.
    // Aqui o "select" e visual + handoff pra historia.
  }

  return (
    <>
      <AppHeader title="Talento" back="/app" />
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
          <ProcessingView
            text={text}
            onComplete={() => {
              // espera matches; quando eles caem, view muda pra 'matches'
            }}
          />
        )}

        {view === "matches" && (
          <MatchesView
            citizenName={citizenName}
            text={text}
            matches={matches}
            selectedTitle={selectedTitle}
            onSelect={handleSelectMatch}
            onRestart={() => {
              setText("");
              setSelectedTitle(null);
              setView("form");
            }}
            onSeeHistory={() => router.push("/app/historia")}
          />
        )}

        {view === "error" && (
          <ErrorView
            message={errorMessage}
            onRetry={() => setView("form")}
          />
        )}
      </main>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// Form
// ──────────────────────────────────────────────────────────
function FormView(props: {
  greeting: string;
  text: string;
  setText: (v: string) => void;
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
          O que voce faz de melhor?
          <br />
          O que quer aprender?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Manda ver — pode ser por texto ou por voz. To aqui contigo.
        </p>
      </div>

      <textarea
        value={props.text}
        onChange={(e) => props.setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={6}
        className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-base text-text-primary placeholder:text-text-secondary focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          aria-disabled
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-base font-semibold text-text-secondary opacity-60"
          title="Em breve — gravar audio"
        >
          🎤 Por voz
        </button>
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={props.disabled}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-brand-green px-4 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          ✏️ Mandar
        </button>
      </div>

      <Link
        href="/app"
        className="mt-2 self-center text-sm text-text-secondary underline-offset-2 hover:underline"
      >
        voltar pra inicio
      </Link>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// Processing
// ──────────────────────────────────────────────────────────
function ProcessingView({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  return (
    <>
      <div>
        <p className="text-xs uppercase tracking-wider text-brand-green">
          JAZIDA ta pensando
        </p>
        <h2
          className="mt-1 text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          So um instante...
        </h2>
        <blockquote className="mt-3 rounded-2xl bg-brand-bg p-4 text-sm italic text-text-primary">
          “{text}”
        </blockquote>
      </div>
      <AgentCascade steps={CASCADE_STEPS} stepDelayMs={900} onComplete={onComplete} />
    </>
  );
}

// ──────────────────────────────────────────────────────────
// Matches
// ──────────────────────────────────────────────────────────
function MatchesView(props: {
  citizenName: string;
  text: string;
  matches: BussolaMatch[];
  selectedTitle: string | null;
  onSelect: (m: BussolaMatch) => void;
  onRestart: () => void;
  onSeeHistory: () => void;
}) {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-wider text-brand-green">
          Bussola achou {props.matches.length} caminhos
        </p>
        <h2
          className="mt-1 text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {props.citizenName ? `Olha so, ${props.citizenName}.` : "Olha so."}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          A gente cruzou “{shortQuote(props.text)}” com programas reais aqui em
          Mariana.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {props.matches.map((m, i) => (
          <MatchCard
            key={`${m.title}-${i}`}
            match={m}
            index={i}
            onSelect={props.onSelect}
            selected={props.selectedTitle === m.title}
          />
        ))}
      </div>

      {props.selectedTitle && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-brand-green bg-brand-green-light/10 p-4 text-sm text-text-primary"
        >
          Show, anotei seu interesse em <strong>{props.selectedTitle}</strong>.
          Em breve te chamo no whats com o pre-cadastro pronto.
        </motion.div>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={props.onSeeHistory}
          className="flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-brand-green text-base font-semibold text-brand-green hover:bg-brand-green hover:text-white"
        >
          Ver minha historia
        </button>
        <button
          type="button"
          onClick={props.onRestart}
          className="flex min-h-[44px] items-center justify-center text-sm text-text-secondary underline-offset-2 hover:underline"
        >
          mandar outro talento
        </button>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// Error
// ──────────────────────────────────────────────────────────
function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="text-4xl" aria-hidden>
        🤔
      </span>
      <p className="text-base text-text-primary">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-2xl bg-brand-green px-5 py-3 text-sm font-semibold text-white"
      >
        Tentar de novo
      </button>
    </div>
  );
}

function shortQuote(s: string): string {
  return s.length > 60 ? s.slice(0, 60).trim() + "..." : s;
}
