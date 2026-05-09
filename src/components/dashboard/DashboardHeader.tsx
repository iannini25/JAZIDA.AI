"use client";

// DashboardHeader Strata Solo — top bar clara.
// Inclui:
//   - breadcrumbs editorial (operação · cidade · visão geral)
//   - sentimento + relógio
//   - strip de indicadores municipais (IDH · CFEM · IDEB · evasão · saneamento)
//   - pill de condicionantes (X total · N em risco)

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ConditionantsResponse,
  MunicipalIndicatorsDTO,
} from "@/lib/api/dashboard";
import {
  getConditionants,
  getMunicipalIndicators,
} from "@/lib/api/dashboard";
import {
  formatBRL,
  formatPct,
} from "@/lib/external/municipal-indicators";
import type { CityId, SentimentSnapshot } from "@/types";
import { Icon } from "@/components/ui/Icons";

export function DashboardHeader({
  miner,
  cityLabel,
  cityId = "mariana",
  sentiment,
  rightSlot,
}: {
  miner: string;
  cityLabel: string;
  cityId?: CityId;
  sentiment?: SentimentSnapshot;
  rightSlot?: React.ReactNode;
}) {
  const [now, setNow] = useState<string>(formatNow());
  const [indicators, setIndicators] = useState<MunicipalIndicatorsDTO | null>(
    null
  );
  const [cond, setCond] = useState<ConditionantsResponse | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(formatNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    getMunicipalIndicators(cityId)
      .then((d) => {
        if (active) setIndicators(d);
      })
      .catch(() => {});
    getConditionants({ cityId })
      .then((d) => {
        if (active) setCond(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cityId]);

  const value = sentiment?.current ?? 0;
  const display = value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  const trendSymbol =
    sentiment?.trend === "up" ? "↑" : sentiment?.trend === "down" ? "↓" : "→";
  const sentimentColor =
    value > 0.3
      ? "var(--jazida-verde-vivo)"
      : value < -0.3
        ? "var(--sinal-critico)"
        : "var(--sinal-atencao)";

  return (
    <header className="border-b border-solo-linha bg-solo-papel-claro">
      {/* breadcrumbs */}
      <div className="flex h-14 items-center gap-4 px-8">
        <div className="mono-s flex items-center gap-2 text-solo-tinta-tenue">
          <span>operação</span>
          <Icon name="i-chev" size={11} />
          <span>{cityLabel.toLowerCase()}</span>
          <Icon name="i-chev" size={11} />
          <span className="text-solo-tinta">visão geral</span>
        </div>
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>

      {/* hero do header */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-8 pt-5">
        <div>
          <p className="micro" style={{ color: "var(--ferro)" }}>
            JAZIDA · {miner}
          </p>
          <h1
            className="display-m mt-1 text-solo-tinta"
            style={{ fontSize: 22 }}
          >
            {cityLabel}
          </h1>
        </div>

        {sentiment && (
          <div className="flex items-baseline gap-2 border-l border-solo-linha-forte pl-8">
            <span className="micro text-solo-tinta-tenue">sentimento</span>
            <span
              className="mono-l"
              style={{ color: sentimentColor, fontSize: 22 }}
            >
              {display}
            </span>
            <span className="body-s text-solo-tinta-suave">{trendSymbol}</span>
          </div>
        )}

        {/* Pill de condicionantes — gap critico que a tese pede */}
        {cond && cond.summary.total > 0 && (
          <Link
            href="/dashboard/condicionantes"
            className="flex items-baseline gap-2 border-l border-solo-linha-forte pl-8 hover:opacity-70"
          >
            <span className="micro text-solo-tinta-tenue">condicionantes</span>
            <span
              className="mono-l"
              style={{ color: "var(--solo-tinta)", fontSize: 22 }}
            >
              {cond.summary.total}
            </span>
            {cond.summary.emRisco > 0 && (
              <span
                className="strata-chip"
                style={{
                  color: "var(--sinal-critico)",
                  borderColor: "rgba(168,58,40,0.4)",
                  background: "rgba(168,58,40,0.08)",
                  fontSize: 11,
                }}
              >
                {cond.summary.emRisco} em risco
              </span>
            )}
            {cond.summary.vencidas > 0 && (
              <span
                className="strata-chip"
                style={{
                  color: "var(--sinal-critico)",
                  borderColor: "rgba(168,58,40,0.6)",
                  background: "rgba(168,58,40,0.15)",
                  fontSize: 11,
                }}
              >
                {cond.summary.vencidas} vencida(s)
              </span>
            )}
          </Link>
        )}

        <div className="flex items-baseline gap-2 border-l border-solo-linha-forte pl-8">
          <span className="micro text-solo-tinta-tenue">atualizado</span>
          <span className="mono-s text-solo-tinta">{now}</span>
        </div>
      </div>

      {/* strip de indicadores municipais — gap critico da tese */}
      {indicators && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-solo-linha bg-solo-papel-fundo/50 px-8 py-2.5">
          <span className="micro text-solo-tinta-tenue">
            IBGE · INEP · ANM · DataSUS
          </span>
          <Indicator label="IDH" value={indicators.idh.toFixed(3)} />
          <Indicator
            label="população"
            value={indicators.populacao.toLocaleString("pt-BR")}
          />
          <Indicator
            label="PIB"
            value={formatBRL(indicators.pibMunicipal, { compact: true })}
          />
          <Indicator
            label="CFEM/ano"
            value={formatBRL(indicators.cfemAnualReceived, { compact: true })}
            accent="warm"
          />
          <Indicator label="IDEB" value={indicators.ideb.toFixed(1)} />
          <Indicator
            label="evasão"
            value={formatPct(indicators.evasaoEscolar)}
            accent={indicators.evasaoEscolar > 0.08 ? "warn" : undefined}
          />
          <Indicator
            label="saneamento"
            value={formatPct(indicators.saneamentoBasico, 0)}
            accent={indicators.saneamentoBasico < 0.75 ? "warn" : undefined}
          />
          <Indicator
            label="dependência mineral"
            value={formatPct(indicators.dependenciaMineral, 0)}
            accent={indicators.dependenciaMineral > 0.5 ? "warn" : undefined}
          />
        </div>
      )}
    </header>
  );
}

function Indicator({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warn" | "warm";
}) {
  const color =
    accent === "warn"
      ? "var(--sinal-critico)"
      : accent === "warm"
        ? "var(--ferro)"
        : "var(--solo-tinta)";
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-[10px] uppercase tracking-microlabel text-solo-tinta-tenue"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </span>
      <span className="mono-s font-medium" style={{ color, fontSize: 12 }}>
        {value}
      </span>
    </div>
  );
}

function formatNow(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
