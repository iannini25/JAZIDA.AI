"use client";

// /app/historia — timeline pessoal do cidadao.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/citizen/AppHeader";
import { TimelineEntry } from "@/components/citizen/TimelineEntry";
import { getHistory } from "@/lib/api/citizen";
import { getStoredCitizenName } from "@/lib/citizen-storage";
import { getStoredAuth } from "@/lib/auth-storage";
import type { CitizenHistory } from "@/types";

export default function HistoriaPage() {
  const router = useRouter();
  const [history, setHistory] = useState<CitizenHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const auth = getStoredAuth();
      if (!auth) {
        router.replace("/");
        return;
      }
      try {
        const id = auth.citizenId;
        if (!id) {
          throw new Error("Cidadão não identificado");
        }
        const h = await getHistory(id);
        if (!cancelled) setHistory(h);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não deu pra carregar sua história."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const firstName =
    history?.citizen.name.split(" ")[0] || getStoredCitizenName() || "você";

  return (
    <>
      <AppHeader title="Sua história" back="/app" />
      <main className="flex flex-1 flex-col gap-5 px-5 py-6 pb-24">
        <div>
          <p className="text-sm uppercase tracking-wider text-brand-green">
            Linha do tempo
          </p>
          <h1
            className="mt-1 text-2xl font-bold leading-tight text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            E aí, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Aqui tá tua história com a Vale — tudo que você pediu e tudo que já
            foi escutado.
          </p>
        </div>

        {loading && <SkeletonList />}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && history && history.items.length === 0 && (
          <EmptyState />
        )}

        {!loading && !error && history && history.items.length > 0 && (
          <div className="flex flex-col gap-3">
            {history.items.map((item, i) => (
              <TimelineEntry key={i} entry={item} />
            ))}
          </div>
        )}

        <Link
          href="/app"
          className="mt-3 flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-brand-green text-base font-semibold text-brand-green hover:bg-brand-green hover:text-white"
        >
          Quero adicionar mais coisas
        </Link>
      </main>
    </>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-gray-100"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center">
      <span className="text-3xl" aria-hidden>
        🌱
      </span>
      <h3 className="mt-2 text-base font-semibold text-text-primary">
        Tua história começa agora
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Manda um talento ou uma queixa que aparece aqui na hora.
      </p>
    </div>
  );
}
