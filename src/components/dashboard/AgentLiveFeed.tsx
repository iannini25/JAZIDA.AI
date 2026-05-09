"use client";

// AgentLiveFeed — feed cronologico inverso de eventos de agents.
// Conecta no SSE, recebe snapshot inicial + push de novos eventos.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  streamAgentEvents,
  getAgentEvents,
  type StreamHandlers,
} from "@/lib/api/dashboard";
import type { AgentEvent, AgentName } from "@/types";
import { cn } from "@/lib/utils";

const AGENT_THEME: Record<
  AgentName,
  { bg: string; ring: string; initial: string }
> = {
  Acolhida: { bg: "bg-rose-100", ring: "ring-rose-200", initial: "A" },
  Talento: { bg: "bg-emerald-100", ring: "ring-emerald-200", initial: "T" },
  Voz: { bg: "bg-orange-100", ring: "ring-orange-200", initial: "V" },
  Bussola: { bg: "bg-sky-100", ring: "ring-sky-200", initial: "B" },
  Replica: { bg: "bg-violet-100", ring: "ring-violet-200", initial: "R" },
  Pulsar: { bg: "bg-amber-100", ring: "ring-amber-200", initial: "P" },
  Pacto: { bg: "bg-indigo-100", ring: "ring-indigo-200", initial: "P" },
  Semente: { bg: "bg-lime-100", ring: "ring-lime-200", initial: "🌱" },
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

    // Snapshot inicial via REST (caso SSE atrase ou falhe).
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

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Agents ao vivo
        </h3>
        <ConnectionDot connected={connected} pulse={pulse} />
      </div>

      <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {events.map((e) => {
            const theme = AGENT_THEME[e.agentName] ?? {
              bg: "bg-gray-100",
              ring: "ring-gray-200",
              initial: e.agentName[0] || "?",
            };
            return (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2",
                    theme.bg,
                    theme.ring
                  )}
                >
                  {theme.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {e.agentName}
                    </span>
                    <span className="shrink-0 text-[10px] text-text-secondary">
                      {formatRelative(e.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                    {e.action}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {events.length === 0 && (
          <li className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-text-secondary">
            Aguardando eventos...
          </li>
        )}
      </ul>
    </div>
  );
}

function ConnectionDot({
  connected,
  pulse,
}: {
  connected: boolean;
  pulse: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-secondary">
      <span
        className={cn(
          "h-2 w-2 rounded-full transition-all",
          connected ? "bg-brand-green" : "bg-gray-300",
          pulse && "ring-4 ring-brand-green/30"
        )}
      />
      {connected ? "live" : "offline"}
    </span>
  );
}

function dedupe(prev: AgentEvent[], id: string): AgentEvent[] {
  return prev.filter((p) => p.id !== id);
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 5_000) return "agora";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 60 * 60_000) return `${Math.floor(ms / 60_000)}min`;
  return `${Math.floor(ms / 3_600_000)}h`;
}
