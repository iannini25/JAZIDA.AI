"use client";

// TimelineEntry Strata — linha de revista. Hairline divider + icone monoline +
// data em mono + chip de status.

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HistoryItem } from "@/types";
import { Icon, type IconName } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export type TimelineEntryProps = { entry: HistoryItem };

export function TimelineEntry({ entry }: TimelineEntryProps) {
  if (entry.kind === "talent") return <TalentItem talent={entry.data} />;
  if (entry.kind === "complaint") return <ComplaintItem complaint={entry.data} />;
  if (entry.kind === "idea") return <IdeaItem idea={entry.data} />;
  return <ReplicaItem replica={entry.data} />;
}

function dateLabel(iso: string): string {
  try {
    return format(new Date(iso), "dd 'de' MMM, HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function Header({
  icon,
  iconColor,
  kind,
  iso,
  trailing,
}: {
  icon: IconName;
  iconColor: string;
  kind: string;
  iso: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3">
      <span style={{ color: iconColor }}>
        <Icon name={icon} size={16} />
      </span>
      <span className="micro text-solo-tinta-tenue">{kind}</span>
      <span className="mono-s text-solo-tinta-tenue">·</span>
      <span className="mono-s text-solo-tinta-tenue">{dateLabel(iso)}</span>
      {trailing && <span className="ml-auto">{trailing}</span>}
    </header>
  );
}

function TalentItem({
  talent,
}: {
  talent: Extract<HistoryItem, { kind: "talent" }>["data"];
}) {
  const matches = talent.matches ?? [];
  return (
    <article className="rounded-[10px] border border-solo-linha bg-solo-papel-claro p-4">
      <Header
        icon="i-mira"
        iconColor="var(--jazida-verde)"
        kind="§ talento"
        iso={talent.createdAt}
      />
      <p className="body-strata mt-3 italic text-solo-tinta-suave">
        “{talent.rawInput}”
      </p>
      {talent.structured?.label && (
        <p className="caption mt-2 text-solo-tinta-tenue">
          tema: {talent.structured.label} · {talent.structured.category}
        </p>
      )}
      {matches.length > 0 && (
        <div className="mt-3 border-t border-solo-linha pt-3">
          <p className="micro text-jazida-verde">
            Bussola achou {matches.length} caminhos
          </p>
          <ul className="mt-2 space-y-1 body-s text-solo-tinta">
            {matches.slice(0, 3).map((m, i) => (
              <li key={i} className="flex gap-2">
                <span className="mono-s text-solo-tinta-tenue">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="font-medium">{m.title}</span>
                  {m.cost ? (
                    <span className="text-solo-tinta-tenue"> — {m.cost}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

const STATUS_INFO: Record<
  "open" | "in_progress" | "resolved",
  { label: string; chipClass: string }
> = {
  open: {
    label: "em analise",
    chipClass: "border-[rgba(201,133,58,0.4)] text-sinal-alerta bg-[rgba(201,133,58,0.08)]",
  },
  in_progress: {
    label: "em andamento",
    chipClass: "border-[rgba(61,111,143,0.4)] text-sinal-info bg-[rgba(61,111,143,0.08)]",
  },
  resolved: {
    label: "resolvido",
    chipClass: "border-[rgba(63,128,96,0.4)] text-jazida-verde bg-jazida-verde/10",
  },
};

function ComplaintItem({
  complaint,
}: {
  complaint: Extract<HistoryItem, { kind: "complaint" }>["data"];
}) {
  const isSuggestion = complaint.type === "suggestion";
  const statusInfo = STATUS_INFO[complaint.status];
  return (
    <article className="rounded-[10px] border border-solo-linha bg-solo-papel-claro p-4">
      <Header
        icon={isSuggestion ? "i-cris" : "i-meg"}
        iconColor={isSuggestion ? "var(--jazida-verde)" : "var(--ferro)"}
        kind={isSuggestion ? "§ sugestao" : "§ reclamacao"}
        iso={complaint.createdAt}
        trailing={
          <span
            className={cn(
              "strata-chip",
              statusInfo.chipClass
            )}
          >
            [{statusInfo.label}]
          </span>
        }
      />
      <p className="body-strata mt-3 italic text-solo-tinta-suave">
        “{complaint.rawInput}”
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="strata-chip">{complaint.classification.category}</span>
        {complaint.classification.neighborhood && (
          <span className="strata-chip">
            {complaint.classification.neighborhood}
          </span>
        )}
        <span className="strata-chip">
          urgencia {complaint.classification.urgency}
        </span>
      </div>
      <p className="mono-s mt-3 text-solo-tinta-tenue">
        protocolo {complaint.protocolNumber}
      </p>
      {complaint.resolvedAction && (
        <div className="mt-3 border-l-2 border-jazida-verde bg-jazida-verde/5 p-3">
          <p className="micro text-jazida-verde">Resposta da Vale</p>
          <p className="body-s mt-1 text-solo-tinta">{complaint.resolvedAction}</p>
        </div>
      )}
    </article>
  );
}

function IdeaItem({
  idea,
}: {
  idea: Extract<HistoryItem, { kind: "idea" }>["data"];
}) {
  // Strata: nao mostramos veredito/score/plano pro cidadao.
  // Apenas confirmamos que recebemos e estamos analisando.
  return (
    <article className="rounded-[10px] border border-solo-linha bg-solo-papel-claro p-4">
      <Header
        icon="i-broto"
        iconColor="var(--jazida-verde-vivo)"
        kind="§ ideia"
        iso={idea.createdAt}
        trailing={
          <span className="strata-chip border-[rgba(63,128,96,0.4)] bg-jazida-verde/10 text-jazida-verde">
            [em analise]
          </span>
        }
      />
      <p className="body-strata mt-3 italic text-solo-tinta-suave">
        “{idea.rawInput}”
      </p>
      <p className="caption mt-3 text-solo-tinta-tenue">
        sua ideia foi recebida. equipe de investimento social vai analisar e te
        retornar com proximos passos.
      </p>
    </article>
  );
}

function ReplicaItem({
  replica,
}: {
  replica: Extract<HistoryItem, { kind: "replica" }>["data"];
}) {
  return (
    <article className="rounded-[10px] border-l-2 border-jazida-verde bg-jazida-verde/5 p-4">
      <Header
        icon="i-balao"
        iconColor="var(--jazida-verde)"
        kind="§ resposta da Vale"
        iso={replica.createdAt}
      />
      <p className="body-strata mt-3 text-solo-tinta">{replica.message}</p>
    </article>
  );
}
