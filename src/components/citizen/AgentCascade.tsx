"use client";

// AgentCascade — mostra agents trabalhando ao vivo durante o "processando".
//
// Modo simulado: passa `steps` com nomes (ex: ["Acolhida", "Talento", "Bussola"])
// e o componente anima cada um sequencialmente com delay configuravel.
// Modo externo: passa `events` que ja contem status — usado quando o caller
// alimenta via SSE.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type CascadeStep = {
  agent: string;
  description?: string;
};

export type CascadeEvent = CascadeStep & {
  status: "pending" | "running" | "done";
};

export type AgentCascadeProps = {
  steps?: CascadeStep[]; // modo simulado
  events?: CascadeEvent[]; // modo externo (alimentado pelo caller)
  stepDelayMs?: number; // delay entre steps no modo simulado
  className?: string;
  onComplete?: () => void;
};

const AGENT_LABELS: Record<string, string> = {
  Acolhida: "Acolhida ouvindo",
  Talento: "Talento entendendo",
  Voz: "Voz classificando",
  Bussola: "Bussola buscando caminhos",
  Replica: "Replica preparando resposta",
  Pulsar: "Pulsar atualizando sentimento",
  Pacto: "Pacto gerando relatorio",
};

export function AgentCascade(props: AgentCascadeProps) {
  const isControlled = !!props.events;
  const stepDelayMs = props.stepDelayMs ?? 700;

  const [internalIndex, setInternalIndex] = useState(0);

  useEffect(() => {
    if (isControlled || !props.steps) return;
    if (internalIndex >= props.steps.length) {
      props.onComplete?.();
      return;
    }
    const t = setTimeout(() => setInternalIndex((i) => i + 1), stepDelayMs);
    return () => clearTimeout(t);
  }, [internalIndex, isControlled, props, stepDelayMs]);

  const events: CascadeEvent[] = isControlled
    ? props.events!
    : (props.steps ?? []).map((s, i) => ({
        ...s,
        status:
          i < internalIndex
            ? "done"
            : i === internalIndex
              ? "running"
              : "pending",
      }));

  return (
    <div className={cn("flex flex-col gap-3", props.className)}>
      <AnimatePresence>
        {events.map((e, i) => {
          const visible = e.status !== "pending" || i <= internalIndex;
          if (!visible) return null;
          return (
            <motion.div
              key={`${e.agent}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                e.status === "done"
                  ? "border-brand-green-light bg-brand-green-light/10"
                  : e.status === "running"
                    ? "border-brand-green bg-white shadow-sm"
                    : "border-gray-200 bg-gray-50 opacity-70"
              )}
            >
              <StatusDot status={e.status} />
              <div className="flex-1 text-text-primary">
                <div className="text-sm font-semibold">
                  {AGENT_LABELS[e.agent] ?? e.agent}
                </div>
                {e.description && (
                  <div className="text-xs text-text-secondary">
                    {e.description}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function StatusDot({ status }: { status: CascadeEvent["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-green text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex h-7 w-7 items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center">
      <span className="h-3 w-3 rounded-full bg-gray-300" />
    </span>
  );
}
