"use client";

// /dashboard/condicionantes — lista de condicionantes do licenciamento.
// Mostra prazo, agência, status, alertas comunitários linkados, KPI alvo.

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getConditionants,
  type ConditionantsResponse,
} from "@/lib/api/dashboard";
import type { Conditionant, ConditionantStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icons";

const STATUS_META: Record<
  ConditionantStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  "em-prazo": {
    label: "em prazo",
    color: "var(--jazida-verde)",
    bg: "rgba(63,128,96,0.10)",
    border: "rgba(63,128,96,0.40)",
  },
  "em-risco": {
    label: "em risco",
    color: "var(--sinal-alerta)",
    bg: "rgba(201,133,58,0.12)",
    border: "rgba(201,133,58,0.45)",
  },
  vencida: {
    label: "vencida",
    color: "var(--sinal-critico)",
    bg: "rgba(168,58,40,0.12)",
    border: "rgba(168,58,40,0.50)",
  },
};

const AGENCY_META: Record<string, string> = {
  IBAMA: "Instituto Brasileiro do Meio Ambiente",
  SEMAD: "Secretaria de Estado de Meio Ambiente (MG)",
  ANM: "Agência Nacional de Mineração",
  DNPM: "Departamento Nacional de Produção Mineral",
};

export default function CondicionantesPage() {
  const [data, setData] = useState<ConditionantsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getConditionants({ cityId: "mariana" })
      .then((d) => {
        if (active) setData(d);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col">
      <header className="border-b border-solo-linha bg-solo-papel-claro px-6 py-4">
        <p className="micro" style={{ color: "var(--ferro)" }}>
          Licenciamento ambiental · Mariana, MG
        </p>
        <h1 className="display-m mt-1 text-solo-tinta" style={{ fontSize: 22 }}>
          Condicionantes do licenciamento
        </h1>
        <p className="body-s mt-1 text-solo-tinta-suave">
          Cada condicionante do licenciamento operacional vinculada a sinais
          comunitários, ações em andamento e KPI alvo.
        </p>

        {data && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Stat label="total" value={data.summary.total} />
            <Stat
              label="em prazo"
              value={data.summary.emPrazo}
              accent="good"
            />
            <Stat
              label="em risco"
              value={data.summary.emRisco}
              accent="warn"
            />
            <Stat
              label="vencidas"
              value={data.summary.vencidas}
              accent="critical"
            />
            {data.summary.nextDeadline && (
              <Stat
                label="próximo vencimento"
                value={format(
                  new Date(data.summary.nextDeadline),
                  "dd/MM/yyyy",
                  { locale: ptBR }
                )}
              />
            )}
          </div>
        )}
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
          {loading && (
            <p className="body-s text-solo-tinta-tenue">carregando…</p>
          )}
          {data?.conditionants.map((c) => (
            <ConditionantRow key={c.id} c={c} />
          ))}
          {!loading && data?.conditionants.length === 0 && (
            <p className="rounded-[10px] border border-dashed border-solo-linha-forte p-6 text-center body-s text-solo-tinta-tenue">
              Sem condicionantes cadastradas pra esta cidade.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function ConditionantRow({ c }: { c: Conditionant }) {
  const meta = STATUS_META[c.status];
  const daysToDeadline = Math.round(
    (new Date(c.deadline).getTime() - Date.now()) / 86_400_000
  );

  return (
    <article
      className="rounded-[10px] border bg-solo-papel-claro p-5"
      style={{ borderColor: meta.border, borderLeftWidth: 3 }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="mono-m text-solo-tinta">{c.id}</span>
            <span className="strata-chip" style={{ fontSize: 11 }}>
              {c.agency}
            </span>
            <span
              className="strata-chip"
              style={{
                color: meta.color,
                borderColor: meta.border,
                background: meta.bg,
                fontSize: 11,
              }}
            >
              ◈ {meta.label}
            </span>
          </div>
          <p className="caption mt-1 text-solo-tinta-tenue">
            {AGENCY_META[c.agency]}
          </p>
        </div>
        <div className="text-right">
          <p className="micro text-solo-tinta-tenue">prazo</p>
          <p
            className="mono-m"
            style={{
              color: c.status === "vencida" ? "var(--sinal-critico)" : undefined,
              fontSize: 16,
            }}
          >
            {format(new Date(c.deadline), "dd/MM/yyyy", { locale: ptBR })}
          </p>
          <p
            className="caption"
            style={{
              color:
                daysToDeadline < 0
                  ? "var(--sinal-critico)"
                  : daysToDeadline < 30
                    ? "var(--sinal-alerta)"
                    : "var(--solo-tinta-tenue)",
            }}
          >
            {daysToDeadline < 0
              ? `vencida há ${-daysToDeadline} dias`
              : `em ${daysToDeadline} dias`}
          </p>
        </div>
      </header>

      <p className="body-strata mt-3 text-solo-tinta">{c.description}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <p className="micro text-solo-tinta-tenue">KPI alvo</p>
          <p className="body-s mt-1 text-solo-tinta">
            {c.targetKpi || "—"}
          </p>
        </div>
        <div>
          <p className="micro text-solo-tinta-tenue">
            Alertas comunitários linkados
          </p>
          <p className="body-s mt-1 text-solo-tinta">
            {c.linkedAlertIds.length > 0
              ? `${c.linkedAlertIds.length} alerta(s) ativos`
              : "—"}
          </p>
        </div>
        <div>
          <p className="micro text-solo-tinta-tenue">Linhas de orçamento</p>
          <p className="body-s mt-1 text-solo-tinta">
            {c.linkedAllocationLines.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {c.linkedAllocationLines.map((l) => (
                  <span
                    key={l}
                    className="strata-chip"
                    style={{ fontSize: 10 }}
                  >
                    {l}
                  </span>
                ))}
              </span>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      <footer className="mt-4 flex items-center justify-between border-t border-solo-linha pt-3">
        <p className="caption text-solo-tinta-tenue">
          Linkar condicionantes manualmente em{" "}
          <Link
            href="/dashboard/alocacao"
            className="font-semibold text-jazida-verde hover:underline"
          >
            alocação ESG →
          </Link>
        </p>
        <button
          type="button"
          className="strata-btn strata-btn-outline-solo"
          style={{ height: 32, fontSize: 12 }}
        >
          <Icon name="i-doc-selo" size={13} />
          Ver evidências
        </button>
      </footer>
    </article>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "good" | "warn" | "critical";
}) {
  const color =
    accent === "good"
      ? "var(--jazida-verde)"
      : accent === "warn"
        ? "var(--sinal-alerta)"
        : accent === "critical"
          ? "var(--sinal-critico)"
          : "var(--solo-tinta)";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="micro text-solo-tinta-tenue">{label}</span>
      <span className={cn("mono-m font-medium")} style={{ color, fontSize: 16 }}>
        {value}
      </span>
    </div>
  );
}
