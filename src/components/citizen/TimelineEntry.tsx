"use client";

// TimelineEntry — uma entrada no historico do cidadao.

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HistoryItem } from "@/types";
import { cn } from "@/lib/utils";

export type TimelineEntryProps = { entry: HistoryItem };

export function TimelineEntry({ entry }: TimelineEntryProps) {
  if (entry.kind === "talent") return <TalentItem talent={entry.data} />;
  if (entry.kind === "complaint") return <ComplaintItem complaint={entry.data} />;
  return <ReplicaItem replica={entry.data} />;
}

function dateLabel(iso: string): string {
  try {
    return format(new Date(iso), "dd 'de' MMM, HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function TalentItem({ talent }: { talent: Extract<HistoryItem, { kind: "talent" }>["data"] }) {
  const matches = talent.matches ?? [];
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <header className="flex items-center gap-2 text-xs text-text-secondary">
        <span className="text-base" aria-hidden>
          🎯
        </span>
        <span>Talento · {dateLabel(talent.createdAt)}</span>
      </header>
      <p className="mt-2 text-sm leading-relaxed text-text-primary">
        “{talent.rawInput}”
      </p>
      {talent.structured?.label && (
        <p className="mt-2 text-xs uppercase tracking-wide text-text-secondary">
          tema: {talent.structured.label} · {talent.structured.category}
        </p>
      )}
      {matches.length > 0 && (
        <div className="mt-3 rounded-xl bg-brand-green-light/10 p-3">
          <p className="text-xs font-semibold text-brand-green">
            Bussola achou {matches.length} caminhos pra voce:
          </p>
          <ul className="mt-1 space-y-1 text-sm text-text-primary">
            {matches.slice(0, 3).map((m, i) => (
              <li key={i}>
                · <span className="font-medium">{m.title}</span>
                {m.cost ? ` — ${m.cost}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function ComplaintItem({
  complaint,
}: {
  complaint: Extract<HistoryItem, { kind: "complaint" }>["data"];
}) {
  const isSuggestion = complaint.type === "suggestion";
  const statusInfo = STATUS_INFO[complaint.status];
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <header className="flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="flex items-center gap-2">
          <span className="text-base" aria-hidden>
            {isSuggestion ? "💡" : "📢"}
          </span>
          <span>
            {isSuggestion ? "Sugestao" : "Queixa"} · {dateLabel(complaint.createdAt)}
          </span>
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            statusInfo.chipClass
          )}
        >
          {statusInfo.label}
        </span>
      </header>
      <p className="mt-2 text-sm leading-relaxed text-text-primary">
        “{complaint.rawInput}”
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
        <span className="rounded-md bg-gray-100 px-2 py-0.5">
          {complaint.classification.category}
        </span>
        {complaint.classification.neighborhood && (
          <span className="rounded-md bg-gray-100 px-2 py-0.5">
            {complaint.classification.neighborhood}
          </span>
        )}
        <span className="rounded-md bg-gray-100 px-2 py-0.5">
          urgencia {complaint.classification.urgency}
        </span>
      </div>
      <p className="mt-2 font-mono text-xs text-text-secondary">
        protocolo {complaint.protocolNumber}
      </p>
      {complaint.resolvedAction && (
        <div className="mt-3 rounded-xl bg-brand-green-light/10 p-3 text-sm text-text-primary">
          <p className="text-xs font-semibold text-brand-green">
            Resposta da Vale:
          </p>
          <p className="mt-1">{complaint.resolvedAction}</p>
        </div>
      )}
    </article>
  );
}

function ReplicaItem({
  replica,
}: {
  replica: Extract<HistoryItem, { kind: "replica" }>["data"];
}) {
  return (
    <article className="rounded-2xl border border-brand-green-light bg-brand-green-light/10 p-4">
      <header className="flex items-center gap-2 text-xs text-brand-green">
        <span className="text-base" aria-hidden>
          💬
        </span>
        <span>Mensagem da Vale · {dateLabel(replica.createdAt)}</span>
      </header>
      <p className="mt-2 text-sm leading-relaxed text-text-primary">
        {replica.message}
      </p>
    </article>
  );
}

const STATUS_INFO: Record<
  "open" | "in_progress" | "resolved",
  { label: string; chipClass: string }
> = {
  open: { label: "🟡 em analise", chipClass: "bg-amber-100 text-amber-800" },
  in_progress: {
    label: "🔵 em andamento",
    chipClass: "bg-blue-100 text-blue-800",
  },
  resolved: {
    label: "🟢 resolvido",
    chipClass: "bg-emerald-100 text-emerald-800",
  },
};
