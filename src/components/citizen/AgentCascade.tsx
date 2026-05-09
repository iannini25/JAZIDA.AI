"use client";

// AgentCascade — cascata de agents. Sistema Strata: substitui spinner por
// CoreSample (cilindro de testemunho geologico) + lista de estratos numerada.
//
// Modo simulado: passa `steps` com nomes; componente anima sequencialmente.
// Modo controlado: passa `events` que ja vem com status (alimentado por SSE).

import { useEffect, useState } from "react";
import { CoreSample, type CoreStratum } from "@/components/ui/CoreSample";

export type CascadeStep = { agent: string; description?: string };
export type CascadeEvent = CascadeStep & {
  status: "pending" | "running" | "done";
};

export type AgentCascadeProps = {
  steps?: CascadeStep[];
  events?: CascadeEvent[];
  stepDelayMs?: number;
  className?: string;
  onComplete?: () => void;
};

export function AgentCascade(props: AgentCascadeProps) {
  const isControlled = !!props.events;
  const stepDelayMs = props.stepDelayMs ?? 800;
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

  const strata: CoreStratum[] = events.map((e) => ({
    agent: agentName(e.agent),
    status: e.status,
    label: e.description ? `${agentName(e.agent)} — ${e.description}` : agentName(e.agent),
  }));

  return (
    <div className={props.className}>
      <div className="grid items-stretch gap-6" style={{ gridTemplateColumns: "88px 1fr" }}>
        <CoreSample strata={strata} variant="hero" />
        <ol className="flex flex-col justify-between border-l border-solo-linha pl-4">
          {events.map((e, i) => (
            <li key={i} className="flex flex-col gap-0.5 py-1.5">
              <span className="micro text-solo-tinta-tenue">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="body-strata font-medium"
                style={{
                  color:
                    e.status === "pending"
                      ? "var(--solo-tinta-tenue)"
                      : "var(--solo-tinta)",
                }}
              >
                {agentName(e.agent)}
              </span>
              <StatusGloss status={e.status} description={e.description} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function StatusGloss({
  status,
  description,
}: {
  status: CascadeEvent["status"];
  description?: string;
}) {
  if (status === "done") {
    return (
      <span className="caption text-jazida-verde">
        ✓ {description ?? "ouvido"}
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="caption inline-flex items-center gap-1.5 text-ferro">
        <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ferro" />
        {description ?? "em curso"}
      </span>
    );
  }
  return (
    <span className="caption text-solo-tinta-tenue">
      {description ? description : "aguardando"}
    </span>
  );
}

function agentName(raw: string): string {
  // strip prefix "Semente · X" -> "Semente"
  if (raw.startsWith("Semente")) return "Semente";
  return raw;
}
