"use client";

// AgentLiveFeed Strata Solo — log mineral mono em fundo claro.
// Cada linha: timestamp · agente (cor mineral) · ação · chip.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  streamAgentEvents,
  getAgentEvents,
  type StreamHandlers,
} from "@/lib/api/dashboard";
import type { AgentEvent, AgentName } from "@/types";
import { CoreSample } from "@/components/ui/CoreSample";
import { cn } from "@/lib/utils";

const AGENT_COLOR: Record<AgentName, string> = {
  Acolhida: "var(--ocre)",
  Talento: "var(--jazida-verde-vivo)",
  Voz: "var(--ferro)",
  Bussola: "var(--cobre)",
  Replica: "var(--grafite)",
  Pulsar: "var(--sinal-info)",
  Pacto: "var(--jazida-verde-vivo)",
  Semente: "var(--jazida-verde-vivo)",
};

export type AgentLiveFeedProps = {
  limit?: number;
  className?: string;
};

export function AgentLiveFeed({ limit = 12, className }: AgentLiveFeedProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [pulse, setPulse] = useState<boolean>(false);
  const heartbeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    getAgentEvents(limit)
      .then((evs) => {
        if (active) setEvents(evs);
      })
      .catch(() => {});

    const handlers: StreamHandlers = {
      onSnapshot: (evs) => {
        if (!active) return;
        setEvents(evs.slice(0, limit));
        setConnected(true);
      },
      onEvent: (e) => {
        if (!active) return;
        setEvents((prev) => [e, ...dedupe(prev, e.id)].slice(0, limit));
      },
      onHeartbeat: () => {
        if (!active) return;
        setConnected(true);
        setPulse(true);
        if (heartbeatTimer.current) clearTimeout(heartbeatTimer.current);
        heartbeatTimer.current = setTimeout(() => setPulse(false), 600);
      },
      onError: () => {
        if (!active) return;
        setConnected(false);
      },
    };

    const close = streamAgentEvents(handlers);
    return () => {
      active = false;
      if (heartbeatTimer.current) clearTimeout(heartbeatTimer.current);
      close();
    };
  }, [limit]);

  // Mini CoreSample lateral mostrando quais agentes já tiveram atividade
  const KNOWN: AgentName[] = [
    "Acolhida",
    "Talento",
    "Voz",
    "Bussola",
    "Replica",
    "Pulsar",
    "Pacto",
  ];
  const stratumStatus = KNOWN.map((agent) => {
    const recent = events.find((e) => e.agentName === agent);
    return {
      agent,
      status: recent ? ("done" as const) : ("pending" as const),
    };
  });

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span
          className="micro inline-flex items-center gap-1.5"
          style={{ color: "var(--jazida-verde)" }}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-jazida-verde",
              pulse && "animate-pulse-dot"
            )}
          />
          Live · agentes
        </span>
        <ConnectionLabel connected={connected} />
      </div>

      <div
        className="grid items-start gap-4"
        style={{ gridTemplateColumns: "48px 1fr" }}
      >
        <CoreSample strata={stratumStatus} variant="mini" />
        <ul className="flex flex-col overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className="grid items-center gap-3 border-b border-solo-linha py-2 last:border-b-0"
                style={{ gridTemplateColumns: "70px 90px 1fr auto" }}
              >
                <span
                  className="mono-s text-solo-tinta-tenue"
                  style={{ fontSize: 11 }}
                >
                  {formatTime(e.timestamp)}
                </span>
                <span
                  className="mono-s lowercase"
                  style={{
                    color: AGENT_COLOR[e.agentName] ?? "var(--ocre)",
                    fontSize: 12,
                  }}
                >
                  {e.agentName.toLowerCase()}
                </span>
                <span className="body-s truncate text-solo-tinta-suave">
                  {e.action}
                </span>
                {e.payload?.fallback && (
                  <span
                    className="strata-chip"
                    style={{ fontSize: 10 }}
                  >
                    fallback
                  </span>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
          {events.length === 0 && (
            <li className="body-s py-6 text-center text-solo-tinta-tenue">
              Aguardando sinais...
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ConnectionLabel({ connected }: { connected: boolean }) {
  return (
    <span className="micro text-solo-tinta-tenue">
      {connected ? "conectado" : "offline"}
    </span>
  );
}

function dedupe(prev: AgentEvent[], id: string): AgentEvent[] {
  return prev.filter((p) => p.id !== id);
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
