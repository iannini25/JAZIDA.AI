"use client";

// /dashboard/esg-report — geracao e visualizacao do relatorio ESG completo.

import { useState } from "react";
import { motion } from "framer-motion";
import { ESGReportPreview } from "@/components/dashboard/ESGReportPreview";
import {
  generateEsgReport,
  type EsgReportResponse,
} from "@/lib/api/dashboard";
import type { CityId, ESGFramework } from "@/types";
import { cn } from "@/lib/utils";

const FRAMEWORKS: ESGFramework[] = ["CSRD", "CVM59", "GRI", "ICMM"];
const CITIES: CityId[] = ["mariana", "itabira", "paracatu", "araxa"];
const PERIODS = ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"];

export default function EsgReportPage() {
  const [framework, setFramework] = useState<ESGFramework>("CSRD");
  const [cityId, setCityId] = useState<CityId>("mariana");
  const [period, setPeriod] = useState<string>("2026-Q3");
  const [report, setReport] = useState<EsgReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const r = await generateEsgReport({ framework, cityId, period });
      setReport(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao gerar relatório.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          ESG Reporting
        </p>
        <h1 className="text-lg font-bold text-text-primary">
          Relatório ESG completo
        </h1>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
          <section className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Framework"
              value={framework}
              options={FRAMEWORKS}
              onChange={(v) => setFramework(v as ESGFramework)}
            />
            <Select
              label="Cidade"
              value={cityId}
              options={CITIES}
              onChange={(v) => setCityId(v as CityId)}
            />
            <Select
              label="Periodo"
              value={period}
              options={PERIODS}
              onChange={setPeriod}
            />
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="self-end flex min-h-[42px] items-center justify-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "gerando..." : "Gerar rascunho"}
            </button>
          </section>

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {err}
            </div>
          )}

          {report && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-text-secondary">
                <span>
                  <strong className="text-text-primary">{report.framework}</strong> ·{" "}
                  {report.cityId} · {report.period}
                </span>
                <span className="text-[11px]">
                  {report.fragments.length} fragmentos · gerado{" "}
                  {new Date(report.generatedAt).toLocaleString("pt-BR")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob(
                      [JSON.stringify(report, null, 2)],
                      { type: "application/json" }
                    );
                    const u = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = u;
                    a.download = `jazida-esg-${report.framework}-${report.period}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(u);
                  }}
                  className="ml-auto rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-text-primary hover:bg-gray-50"
                >
                  Exportar JSON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "PDF mockado: relatório enviado para sustentabilidade@vale.com"
                    )
                  }
                  className="rounded-md bg-brand-green px-3 py-1 text-xs font-semibold text-white"
                >
                  Exportar PDF
                </button>
              </header>

              <ESGReportPreview fragments={report.fragments} showAll />
            </motion.section>
          )}

          {!report && !loading && (
            <p className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
              Selecione framework, cidade, período e clique em <strong>Gerar rascunho</strong>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
        )}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
