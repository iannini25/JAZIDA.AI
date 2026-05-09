"use client";

// /app/voz — cidadao registra queixa ou sugestao.
// Fluxo: form -> processing (cascade Voz->Pulsar->Vigia) -> protocolo + classificacao

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AgentCascade } from "@/components/citizen/AgentCascade";
import { AppHeader } from "@/components/citizen/AppHeader";
import { ProtocolBadge } from "@/components/citizen/ProtocolBadge";
import {
  submitComplaint,
} from "@/lib/api/citizen";
import { getStoredCitizenName } from "@/lib/citizen-storage";
import { getStoredAuth } from "@/lib/auth-storage";
import { getRateLimit } from "@/lib/api/auth";
import type { Complaint } from "@/types";

type Mode = "complaint" | "suggestion";
type ViewState = "form" | "processing" | "result" | "error";

const PLACEHOLDER_COMPLAINT = `ex: a poeira da pedreira tá insuportável, ninguém consegue estender roupa
ex: caminhões passando de madrugada tremendo a casa toda`;

const PLACEHOLDER_SUGGESTION = `ex: podia ter um curso de gastronomia local pra mulheres do bairro
ex: a praça podia ter mais árvores`;

const CASCADE_STEPS = [
  { agent: "Voz", description: "classificando o que você relatou" },
  { agent: "Pulsar", description: "atualizando o sentimento da cidade" },
  { agent: "Pacto", description: "registrando como sinal ESG" },
];

export default function VozPageWrapper() {
  return (
    <Suspense fallback={<VozLoading />}>
      <VozPage />
    </Suspense>
  );
}

function VozLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10 text-sm text-text-secondary">
      carregando…
    </main>
  );
}

function VozPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prefill") || "";

  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [citizenName, setCitizenName] = useState<string>("");
  const [mode, setMode] = useState<Mode>("complaint");
  const [text, setText] = useState<string>(prefill);
  const [view, setView] = useState<ViewState>("form");
  const [result, setResult] = useState<Complaint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/");
      return;
    }
    if (auth.citizenId) {
      setCitizenId(auth.citizenId);
    }
    setCitizenName(auth.displayName.split(" ")[0] || getStoredCitizenName() || "");

    getRateLimit("complaint").then((info) => {
      if (info) setRemaining(info.remaining + 1);
    }).catch(() => {});
  }, [router]);

  const placeholder = useMemo(
    () => (mode === "complaint" ? PLACEHOLDER_COMPLAINT : PLACEHOLDER_SUGGESTION),
    [mode]
  );

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || !citizenId) return;
    setView("processing");
    setResult(null);
    setErrorMessage("");
    try {
      const { complaint } = await submitComplaint(citizenId, {
        rawInput: trimmed,
        type: mode,
      });
      // Pequeno delay pra cascata terminar antes de mostrar resultado
      await new Promise((r) => setTimeout(r, 1500));
      setResult(complaint);
      setView("result");
      // Atualiza rate limit
      getRateLimit("complaint").then((info) => {
        if (info) setRemaining(info.remaining + 1);
      }).catch(() => {});
    } catch (err) {
      console.error("[voz] erro:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Algo deu errado. Tenta de novo?"
      );
      setView("error");
    }
  }

  return (
    <>
      <AppHeader title="Voz" back="/app" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6 pb-24">
        {view === "form" && (
          <FormView
            citizenName={citizenName}
            mode={mode}
            setMode={setMode}
            text={text}
            setText={setText}
            placeholder={placeholder}
            onSubmit={handleSubmit}
            disabled={!citizenId || !text.trim() || remaining === 0}
            remaining={remaining}
          />
        )}

        {view === "processing" && (
          <ProcessingView text={text} mode={mode} />
        )}

        {view === "result" && result && (
          <ResultView
            citizenName={citizenName}
            complaint={result}
            mode={mode}
            onSeeHistory={() => router.push("/app/historia")}
            onAnother={() => {
              setText("");
              setResult(null);
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
  citizenName: string;
  mode: Mode;
  setMode: (m: Mode) => void;
  text: string;
  setText: (s: string) => void;
  placeholder: string;
  onSubmit: () => void;
  disabled: boolean;
  remaining: number | null;
}) {
  return (
    <>
      <div>
        <p className="text-sm uppercase tracking-wider text-brand-green">
          {props.citizenName ? `${props.citizenName}, manda ver` : "Manda ver"}
        </p>
        <h1
          className="mt-1 text-2xl font-bold leading-tight text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          O que tá ruim?
          <br />
          Como pode melhorar?
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          A gente escuta de verdade — vira sinal ESG, vai pra dashboard da
          mineradora.
        </p>
      </div>

      {props.remaining !== null && (
        <div className="rounded-xl bg-brand-bg px-3 py-2 text-xs text-text-secondary">
          Você pode enviar mais <strong className="text-text-primary">{props.remaining}</strong> queixa(s)/sugestão(ões) nesta hora.
        </div>
      )}

      <div className="grid grid-cols-2 rounded-2xl bg-brand-bg p-1">
        <button
          type="button"
          onClick={() => props.setMode("complaint")}
          className={
            props.mode === "complaint"
              ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm"
              : "rounded-xl px-4 py-2 text-sm font-medium text-text-secondary"
          }
        >
          📢 Reclamar
        </button>
        <button
          type="button"
          onClick={() => props.setMode("suggestion")}
          className={
            props.mode === "suggestion"
              ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-text-primary shadow-sm"
              : "rounded-xl px-4 py-2 text-sm font-medium text-text-secondary"
          }
        >
          💡 Sugerir
        </button>
      </div>

      <textarea
        value={props.text}
        onChange={(e) => props.setText(e.target.value)}
        placeholder={props.placeholder}
        rows={6}
        className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-base text-text-primary placeholder:text-text-secondary focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          aria-disabled
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-text-secondary opacity-60"
          title="Em breve — anexar foto"
        >
          📷 Foto
        </button>
        <button
          type="button"
          disabled
          aria-disabled
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-text-secondary opacity-60"
          title="Em breve — gravar áudio"
        >
          🎤 Áudio
        </button>
      </div>

      <button
        type="button"
        onClick={props.onSubmit}
        disabled={props.disabled}
        className="flex min-h-[56px] items-center justify-center rounded-2xl bg-brand-green text-base font-semibold text-white disabled:opacity-50"
      >
        Enviar
      </button>

      <Link
        href="/app"
        className="self-center text-sm text-text-secondary underline-offset-2 hover:underline"
      >
        voltar pro início
      </Link>
    </>
  );
}

function ProcessingView({ text, mode }: { text: string; mode: Mode }) {
  return (
    <>
      <div>
        <p className="text-xs uppercase tracking-wider text-brand-green">
          JAZIDA recebeu
        </p>
        <h2
          className="mt-1 text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {mode === "complaint" ? "Registrando queixa…" : "Registrando sugestão…"}
        </h2>
        <blockquote className="mt-3 rounded-2xl bg-brand-bg p-4 text-sm italic text-text-primary">
          “{text}”
        </blockquote>
      </div>
      <AgentCascade steps={CASCADE_STEPS} stepDelayMs={650} />
    </>
  );
}

function ResultView(props: {
  citizenName: string;
  complaint: Complaint;
  mode: Mode;
  onSeeHistory: () => void;
  onAnother: () => void;
}) {
  const cls = props.complaint.classification;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs uppercase tracking-wider text-brand-green">
          Recebido
        </p>
        <h2
          className="mt-1 text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          A gente já tá olhando
          {props.citizenName ? `, ${props.citizenName}` : ""}.
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Quando a Vale tomar uma ação, te aviso aqui mesmo.
        </p>
      </motion.div>

      <div className="flex flex-col items-center">
        <ProtocolBadge protocol={props.complaint.protocolNumber} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-text-secondary">
          Como classificamos
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md bg-brand-green-light/15 px-2 py-1 text-brand-green">
            {cls.category}
          </span>
          {cls.neighborhood && (
            <span className="rounded-md bg-gray-100 px-2 py-1 text-text-primary">
              {cls.neighborhood}
            </span>
          )}
          <span
            className={
              cls.urgency === "high"
                ? "rounded-md bg-red-100 px-2 py-1 text-red-800"
                : cls.urgency === "medium"
                  ? "rounded-md bg-amber-100 px-2 py-1 text-amber-800"
                  : "rounded-md bg-gray-100 px-2 py-1 text-text-primary"
            }
          >
            urgência {cls.urgency}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-1 text-text-primary">
            {cls.impact === "collective" ? "coletivo" : "individual"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={props.onSeeHistory}
          className="flex min-h-[52px] items-center justify-center rounded-2xl bg-brand-green text-base font-semibold text-white"
        >
          Ver minha história
        </button>
        <button
          type="button"
          onClick={props.onAnother}
          className="text-sm text-text-secondary underline-offset-2 hover:underline"
        >
          mandar mais um
        </button>
      </div>
    </>
  );
}
