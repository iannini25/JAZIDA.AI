"use client";

// /dashboard — overview executiva da mineradora.
// 4 quadrantes:
//   1. Sentimento (gauge + bairros)
//   2. Alertas do Vigia
//   3. Agents ao vivo (SSE)
//   4. Rascunho do ESG report
//
// Hack ?demo=live: mostra DemoTriggerWidget no canto pra disparar cenarios.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SentimentGauge } from "@/components/dashboard/SentimentGauge";
import { NeighborhoodBars } from "@/components/dashboard/NeighborhoodBars";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { AgentLiveFeed } from "@/components/dashboard/AgentLiveFeed";
import { ESGReportPreview } from "@/components/dashboard/ESGReportPreview";
import { DemoTriggerWidget } from "@/components/dashboard/DemoTriggerWidget";
import {
  generateEsgReport,
  getAlerts,
  getDashboardCitizens,
  getSentiment,
  seedDemo,
  type EsgReportResponse,
} from "@/lib/api/dashboard";
import type { Alert, SentimentSnapshot } from "@/types";

const REFRESH_MS = 10_000;

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardOverview />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <main className="flex-1 px-6 py-10 text-sm text-text-secondary">
      carregando dashboard...
    </main>
  );
}

function DashboardOverview() {
  const searchParams = useSearchParams();
  const isLive = searchParams.get("demo") === "live";

  const [sentiment, setSentiment] = useState<SentimentSnapshot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [esg, setEsg] = useState<EsgReportResponse | null>(null);
  const [citizenCount, setCitizenCount] = useState<number>(0);
  const [signalsCount, setSignalsCount] = useState<number>(0);

  // Boot: garante seed minimo + carrega tudo paralelo
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        // Garante DB populado pra demo nao iniciar vazia
        const cs = await getDashboardCitizens().catch(() => []);
        if (cs.length === 0) {
          await seedDemo().catch(() => {});
        }
        await Promise.all([
          refreshSentiment(),
          refreshAlerts(),
          refreshCitizens(),
          loadEsgIfMissing(),
        ]);
        void cancelled;
      } catch (err) {
        console.error("[dashboard] boot:", err);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshSentiment() {
    try {
      const s = await getSentiment();
      setSentiment(s);
    } catch {}
  }

  async function refreshAlerts() {
    try {
      const a = await getAlerts();
      setAlerts(a);
    } catch {}
  }

  async function refreshCitizens() {
    try {
      const cs = await getDashboardCitizens();
      setCitizenCount(cs.length);
      const signals = cs.reduce(
        (s, c) => s + c.talentsCount + c.complaintsCount,
        0
      );
      setSignalsCount(signals);
    } catch {}
  }

  async function loadEsgIfMissing() {
    try {
      const r = await generateEsgReport({ framework: "CSRD" });
      setEsg(r);
    } catch {}
  }

  // Polling 10s pros 3 paineis dinamicos
  useEffect(() => {
    const t = setInterval(() => {
      void refreshSentiment();
      void refreshAlerts();
      void refreshCitizens();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <DashboardHeader
        miner="Vale"
        cityLabel="Mariana, MG"
        sentiment={sentiment ?? undefined}
        rightSlot={
          <div className="flex items-center gap-3 text-[11px] text-text-secondary">
            <Stat label="cidadaos" value={citizenCount} />
            <Stat label="sinais" value={signalsCount} />
            <Stat label="alertas" value={alerts.length} highlight />
          </div>
        }
      />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
          <Quadrant
            className="xl:col-span-5"
            title="Sentimento da cidade"
            subtitle={
              sentiment
                ? `${sentiment.topThemes.length} temas mapeados · ${sentiment.byNeighborhood.length} bairros · atualiza a cada 10s`
                : "carregando..."
            }
          >
            {sentiment && (
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                <SentimentGauge
                  value={sentiment.current}
                  trend={sentiment.trend}
                />
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                      Por bairro
                    </p>
                    <div className="mt-2">
                      <NeighborhoodBars data={sentiment.byNeighborhood} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                      Top temas
                    </p>
                    <ul className="mt-2 flex flex-col gap-1 text-xs">
                      {sentiment.topThemes.slice(0, 5).map((t) => (
                        <li
                          key={t.label}
                          className="flex items-center justify-between rounded-md bg-brand-bg px-2 py-1"
                        >
                          <span className="font-medium text-text-primary">
                            {t.label}
                          </span>
                          <span className="font-mono text-text-secondary">
                            {t.count} sinais ·{" "}
                            <span
                              style={{
                                color:
                                  t.sentiment > 0.3
                                    ? "#047857"
                                    : t.sentiment < -0.3
                                      ? "#dc2626"
                                      : "#6b7280",
                              }}
                            >
                              {t.sentiment >= 0 ? "+" : ""}
                              {t.sentiment.toFixed(2)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Quadrant>

          <Quadrant
            className="xl:col-span-7"
            title="Alertas do Vigia"
            subtitle={`${alerts.length} ativos`}
            rightAction={
              <Link
                href="/dashboard/citizens"
                className="text-xs font-semibold text-brand-green hover:underline"
              >
                ver cidadaos →
              </Link>
            }
          >
            <AlertsPanel alerts={alerts} limit={4} />
          </Quadrant>

          <Quadrant
            className="xl:col-span-5"
            title="Agents ao vivo"
            subtitle="conectado por SSE — pulsa a cada 2s"
            bodyClassName="max-h-[460px] overflow-hidden"
          >
            <AgentLiveFeed limit={12} />
          </Quadrant>

          <Quadrant
            className="xl:col-span-7"
            title="Rascunho ESG (CSRD)"
            subtitle={
              esg
                ? `gerado ${formatRelative(esg.generatedAt)} · ${esg.fragments.length} fragmentos`
                : "gerando..."
            }
            rightAction={
              <Link
                href="/dashboard/esg-report"
                className="text-xs font-semibold text-brand-green hover:underline"
              >
                relatorio completo →
              </Link>
            }
          >
            <ESGReportPreview
              fragments={esg?.fragments ?? []}
              showAll={false}
              emptyHint="Gerando rascunho do ESG report..."
            />
          </Quadrant>
        </div>
      </main>

      {isLive && <DemoTriggerWidget />}

      {!isLive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pb-6 text-[11px] text-text-secondary"
        >
          Modo apresentacao:{" "}
          <Link
            href="/dashboard?demo=live"
            className="font-semibold text-brand-green hover:underline"
          >
            ?demo=live
          </Link>{" "}
          ativa botoes de trigger no canto.
        </motion.div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">
        {label}
      </span>
      <span
        className={`font-mono text-base font-semibold tabular-nums ${
          highlight && value > 0 ? "text-red-700" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Quadrant({
  title,
  subtitle,
  rightAction,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className ?? ""}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-text-secondary">{subtitle}</p>
          )}
        </div>
        {rightAction}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "agora";
  if (ms < 60 * 60_000) return `ha ${Math.floor(ms / 60_000)}min`;
  return `ha ${Math.floor(ms / 3_600_000)}h`;
}
