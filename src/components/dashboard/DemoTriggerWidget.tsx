"use client";

// DemoTriggerWidget — pop em canto inferior direito. Aparece quando ?demo=live.
// Botoes pra disparar cenarios de demo (Maria / Joao) sem sair da tela.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  triggerDemoScenario,
  seedDemo,
  type DemoScenarioId,
} from "@/lib/api/dashboard";

export function DemoTriggerWidget() {
  const [busy, setBusy] = useState<DemoScenarioId | "seed" | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function fire(action: DemoScenarioId | "seed") {
    setBusy(action);
    setLastResult(null);
    try {
      if (action === "seed") {
        await seedDemo();
        setLastResult("DB populado");
      } else {
        await triggerDemoScenario(action);
        setLastResult(
          action === "maria_enfermagem"
            ? "Maria enviou aspiração"
            : action === "beatriz_costura"
              ? "Beatriz enviou ideia"
              : "João mandou queixa"
        );
      }
    } catch (err) {
      setLastResult(
        "erro: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
      style={{ width: 280 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green">
          Live demo
        </p>
        <span className="font-mono text-[10px] text-text-secondary">
          ?demo=live
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <DemoButton
          label="▶ Maria pede enfermagem"
          subtitle="Talento + Bússola + Réplica"
          onClick={() => fire("maria_enfermagem")}
          loading={busy === "maria_enfermagem"}
        />
        <DemoButton
          label="🌱 Beatriz tem ideia de costura"
          subtitle="Semente analisa demanda + plano"
          onClick={() => fire("beatriz_costura")}
          loading={busy === "beatriz_costura"}
        />
        <DemoButton
          label="▶ João reclama de poeira"
          subtitle="Voz + Pulsar + Vigia"
          onClick={() => fire("joaozinho_poeira")}
          loading={busy === "joaozinho_poeira"}
        />
        <DemoButton
          label="↺ Repopular DB"
          subtitle="seed inicial"
          onClick={() => fire("seed")}
          loading={busy === "seed"}
          subtle
        />
      </div>
      {lastResult && (
        <p className="rounded-md bg-brand-bg p-2 text-[11px] text-text-primary">
          {lastResult}
        </p>
      )}
    </motion.div>
  );
}

function DemoButton({
  label,
  subtitle,
  onClick,
  loading,
  subtle,
}: {
  label: string;
  subtitle: string;
  onClick: () => void;
  loading: boolean;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={
        subtle
          ? "flex flex-col items-start rounded-md px-3 py-2 text-left text-xs text-text-secondary hover:bg-gray-100 disabled:opacity-50"
          : "flex flex-col items-start rounded-md bg-brand-green px-3 py-2 text-left text-white hover:bg-brand-green/90 disabled:opacity-50"
      }
    >
      <span className="text-sm font-semibold">{loading ? "…" : label}</span>
      <span className={subtle ? "text-[10px]" : "text-[10px] text-white/80"}>
        {subtitle}
      </span>
    </button>
  );
}
