"use client";

// /app/empreender — Sistema Strata. UX REVISTA:
//
// Cidadao envia ideia de negocio. Agente Semente AINDA roda no backend
// (analisa, classifica, aterriza no dashboard). MAS o cidadao NAO recebe
// veredito, score ou plano. Ele recebe apenas a confirmacao de que a ideia
// foi recebida e que a equipe de investimento social vai analisar e responder.
//
// Justificativa: a analise e produto pra mineradora (relatorio, alocacao
// ESG, just transition). Pro cidadao, a entrega e simples e digna:
// "recebemos. vamos olhar. te chamamos no whatsapp."

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AgentCascade } from "@/components/citizen/AgentCascade";
import { AppHeader } from "@/components/citizen/AppHeader";
import { Icon } from "@/components/ui/Icons";
import { submitBusinessIdea } from "@/lib/api/citizen";
import { getStoredAuth } from "@/lib/auth-storage";
import { getStoredCitizenId } from "@/lib/citizen-storage";

const PLACEHOLDER = `ex: queria abrir uma padaria perto de casa, sei fazer pão
ex: tava pensando em vender vestido de noiva, sei costurar
ex: quero montar uma marmitaria pra trabalhador da Vale`;

const CASCADE_STEPS = [
  { agent: "Acolhida", description: "ouvindo sua ideia" },
  { agent: "Semente", description: "registrando no canal de investimento" },
];

type ViewState = "form" | "processing" | "received" | "error";

export default function EmpreenderPageWrapper() {
  return (
    <Suspense fallback={<EmpreenderLoading />}>
      <EmpreenderPage />
    </Suspense>
  );
}

function EmpreenderLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10 mono-s text-solo-tinta-tenue">
      carregando…
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
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/");
      return;
    }
    if (auth.citizenId) {
      setCitizenId(auth.citizenId);
    } else {
      const stored = getStoredCitizenId();
      if (stored) setCitizenId(stored);
    }
    setCitizenName(auth.displayName.split(" ")[0] || "");
  }, [router]);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || !citizenId) return;
    setView("processing");
    setErrorMessage("");
    try {
      // O agente Semente roda no backend. O retorno completo (score, plano,
      // financiamento) NAO e mostrado aqui — vai pro dashboard da mineradora.
      const [_submitRes] = await Promise.all([
        submitBusinessIdea(citizenId, trimmed),
        new Promise((r) => setTimeout(r, 2400)),
      ]);
      void _submitRes;
      setView("received");
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
      <AppHeader title="empreender" back="/app" />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8 pb-20">
        {view === "form" && (
          <FormView
            citizenName={citizenName}
            text={text}
            setText={setText}
            onSubmit={handleSubmit}
            disabled={!citizenId || !text.trim()}
          />
        )}

        {view === "processing" && <ProcessingView text={text} />}

        {view === "received" && (
          <ReceivedView
            citizenName={citizenName}
            text={text}
            onSeeHistory={() => router.push("/app/historia")}
            onAnother={() => {
              setText("");
              setView("form");
            }}
          />
        )}

        {view === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Icon name="i-vacuo" size={32} className="text-solo-tinta-tenue" />
            <p className="body-l text-solo-tinta">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setView("form")}
              className="strata-btn strata-btn-primary strata-btn-lg"
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
  text: string;
  setText: (s: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <div>
        <p className="micro" style={{ color: "var(--ferro)" }}>
          § Empreender · canal direto com a Vale
        </p>
        <h1
          className="display-l mt-3 text-solo-tinta"
          style={{ fontSize: 32 }}
        >
          {props.citizenName
            ? `${props.citizenName}, conta a ideia.`
            : "Conta a ideia."}
        </h1>
        <p className="body-l mt-3 text-solo-tinta-suave">
          A equipe de investimento social vai analisar e te retornar pelo
          WhatsApp. Sem julgamento, sem nota.
        </p>
      </div>

      <textarea
        value={props.text}
        onChange={(e) => props.setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={7}
        className="strata-input"
        style={{ resize: "none", padding: 16 }}
      />

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          disabled
          aria-disabled
          className="strata-btn strata-btn-outline-solo strata-btn-lg justify-center"
          style={{ opacity: 0.55 }}
          title="Em breve — gravar áudio"
        >
          <Icon name="i-mic" size={16} />
          Mandar por voz
        </button>
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={props.disabled}
          className="strata-btn strata-btn-primary strata-btn-lg justify-center"
        >
          <Icon name="i-pena" size={16} />
          Enviar minha ideia
        </button>
      </div>

      <Link
        href="/app"
        className="self-center body-s text-solo-tinta-tenue underline-offset-2 hover:underline"
      >
        voltar pro início
      </Link>
    </>
  );
}

function ProcessingView({ text }: { text: string }) {
  return (
    <>
      <div>
        <p className="micro" style={{ color: "var(--ferro)" }}>
          § Registrando ideia
        </p>
        <h2
          className="display-l mt-3 text-solo-tinta"
          style={{ fontSize: 26 }}
        >
          Só um instante…
        </h2>
        <blockquote className="surface-solo mt-4 p-4 body-strata italic text-solo-tinta-suave">
          “{text}”
        </blockquote>
      </div>
      <AgentCascade steps={CASCADE_STEPS} stepDelayMs={1100} />
    </>
  );
}

function ReceivedView(props: {
  citizenName: string;
  text: string;
  onSeeHistory: () => void;
  onAnother: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <p className="micro" style={{ color: "var(--ferro)" }}>
          § Recebido
        </p>
        <h2
          className="display-l mt-3 text-solo-tinta"
          style={{ fontSize: 28 }}
        >
          {props.citizenName
            ? `${props.citizenName}, sua ideia foi registrada.`
            : "Sua ideia foi registrada."}
        </h2>
        <p className="body-l mt-3 text-solo-tinta-suave">
          A equipe de investimento social da Vale vai analisar e cruzar com
          dados da cidade — demanda local, programas de financiamento, talentos
          disponíveis. Quando terminarem, te chamam no WhatsApp com o retorno
          completo.
        </p>
      </motion.div>

      <div className="surface-solo p-5">
        <p className="micro" style={{ color: "var(--solo-tinta-tenue)" }}>
          O que você mandou
        </p>
        <p className="body-strata mt-3 italic text-solo-tinta">
          “{props.text}”
        </p>
      </div>

      <div className="surface-solo border-l-2 border-l-jazida-verde p-5">
        <p className="micro text-jazida-verde">§ Próximos passos</p>
        <ol className="mt-3 flex flex-col gap-3">
          <Step
            order="01"
            title="Sua ideia entra na fila de análise"
            note="prazo médio: 5 dias úteis"
          />
          <Step
            order="02"
            title="Equipe ESG cruza com dados da cidade"
            note="demanda real, competição, programas de financiamento"
          />
          <Step
            order="03"
            title="Você recebe retorno por WhatsApp"
            note="próximos passos concretos: MEI, Sebrae, capital semente, parcerias"
          />
        </ol>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={props.onSeeHistory}
          className="strata-btn strata-btn-primary strata-btn-lg justify-center"
        >
          Ver minha história
          <Icon name="i-arr" size={14} />
        </button>
        <button
          type="button"
          onClick={props.onAnother}
          className="body-s text-solo-tinta-tenue underline-offset-2 hover:underline"
        >
          mandar outra ideia
        </button>
      </div>
    </>
  );
}

function Step({
  order,
  title,
  note,
}: {
  order: string;
  title: string;
  note: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mono-s text-solo-tinta-tenue">{order}</span>
      <div>
        <p className="body-strata font-medium text-solo-tinta">{title}</p>
        <p className="caption text-solo-tinta-tenue">{note}</p>
      </div>
    </li>
  );
}
