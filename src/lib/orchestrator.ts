// Orchestrator — dispatch dos agents.
//
// Funcoes principais:
//   - onTalentReceived: roda Talento -> popula TalentEntry -> dispara Bussola async
//   - onComplaintReceived: roda Voz -> classifica -> Pulsar atualiza sentimento -> Vigia checa spike
//   - generateReplica: chama agent Replica com contexto adequado
//   - generateEsg: chama agent Pacto
//
// Vigia nao e um agent LLM proprio (master so lista 7 agentNames). E um
// detector deterministico que produz Alert do dashboard.

import { db, emitAgentEvent, newId, nowIso, saveDb } from "@/lib/db";
import * as Acolhida from "@/lib/agents/acolhida";
import * as Talento from "@/lib/agents/talento";
import * as Voz from "@/lib/agents/voz";
import * as Bussola from "@/lib/agents/bussola";
import * as Replica from "@/lib/agents/replica";
import * as Pulsar from "@/lib/agents/pulsar";
import * as Pacto from "@/lib/agents/pacto";
import * as Semente from "@/lib/agents/semente";
import type {
  Alert,
  BusinessIdea,
  Citizen,
  CityId,
  Complaint,
  ESGFramework,
  ESGReportFragment,
  ReplicaMessage,
  TalentEntry,
} from "@/types";

export { Acolhida, Talento, Voz, Bussola, Replica, Pulsar, Pacto, Semente };

// ──────────────────────────────────────────────────────────
// Talento: roda agent + dispara Bussola assincrono
// ──────────────────────────────────────────────────────────
export async function onTalentReceived(args: {
  citizen: Citizen;
  talent: TalentEntry;
  rawInput: string;
}): Promise<void> {
  const { citizen, talent } = args;

  // 1) Acolhida — emite evento de recebimento
  emitAgentEvent({
    id: newId(),
    agentName: "Acolhida",
    citizenId: citizen.id,
    action: `Recebeu talento de ${citizen.name.split(" ")[0]}: "${args.rawInput.slice(0, 60)}..."`,
    payload: { talentId: talent.id },
    timestamp: nowIso(),
  });

  // 2) Talento — estrutura a aspiracao
  try {
    const out = await Talento.run({ rawInput: args.rawInput, citizen });
    talent.type = out.type;
    talent.structured = out.structured;
    saveDb();
  } catch (err) {
    console.error("[orchestrator] Talento falhou:", err);
    emitAgentEvent({
      id: newId(),
      agentName: "Talento",
      citizenId: citizen.id,
      action: `ERRO ao estruturar talento: ${err instanceof Error ? err.message : "desconhecido"}`,
      payload: { talentId: talent.id, error: true },
      timestamp: nowIso(),
    });
    return;
  }

  // 3) Bussola — busca matches (roda inline, nao fire-and-forget)
  try {
    const out = await Bussola.run({ citizen, talent });
    talent.matches = out.matches;
    talent.matchApprovalStatus = "pending"; // aguarda aprovacao no dashboard
    saveDb();
  } catch (err) {
    console.error("[orchestrator] Bussola falhou:", err);
    emitAgentEvent({
      id: newId(),
      agentName: "Bussola",
      citizenId: citizen.id,
      action: `ERRO ao buscar matches: ${err instanceof Error ? err.message : "desconhecido"}`,
      payload: { talentId: talent.id, error: true },
      timestamp: nowIso(),
    });
  }
}

// ──────────────────────────────────────────────────────────
// Complaint: roda Voz, atualiza Pulsar (sentimento), checa Vigia
// ──────────────────────────────────────────────────────────
export async function onComplaintReceived(args: {
  citizen: Citizen;
  complaint: Complaint;
  rawInput: string;
  photoUrl?: string;
}): Promise<{ alert?: Alert }> {
  const { citizen, complaint } = args;

  // 1) Acolhida — registra recebimento
  emitAgentEvent({
    id: newId(),
    agentName: "Acolhida",
    citizenId: citizen.id,
    action: `Recebeu ${complaint.type === "suggestion" ? "sugestao" : "queixa"} de ${citizen.name.split(" ")[0]}: "${args.rawInput.slice(0, 60)}..."`,
    payload: { complaintId: complaint.id },
    timestamp: nowIso(),
  });

  // 2) Voz — classifica
  try {
    const out = await Voz.run({
      rawInput: args.rawInput,
      citizen,
      photoUrl: args.photoUrl,
    });
    complaint.type = out.type;
    complaint.classification = out.classification;
    saveDb();
  } catch (err) {
    console.error("[orchestrator] Voz falhou:", err);
    emitAgentEvent({
      id: newId(),
      agentName: "Voz",
      citizenId: citizen.id,
      action: `ERRO ao classificar: ${err instanceof Error ? err.message : "desconhecido"}`,
      payload: { complaintId: complaint.id, error: true },
      timestamp: nowIso(),
    });
  }

  // Pulsar async — heuristica deterministica (nao chama LLM por padrao)
  void Pulsar.run({ cityId: citizen.cityId }).catch((e) =>
    console.error("[orchestrator] Pulsar falhou:", e)
  );

  // Vigia (deterministico)
  const alert = vigiaCheck(citizen.cityId) ?? undefined;
  if (alert) {
    db.alerts.push(alert);
    saveDb();
    emitAgentEvent({
      id: newId(),
      agentName: "Pulsar", // Vigia nao e agentName valido — registra como Pulsar
      action: `ALERTA Vigia: ${alert.title}`,
      payload: { alertId: alert.id, level: alert.level },
      timestamp: nowIso(),
    });
  }
  return { alert };
}

// ──────────────────────────────────────────────────────────
// Vigia — detector deterministico de spikes / categorias quentes
// Regra: se >=5 queixas da mesma categoria no mesmo bairro nas ultimas 24h
// e nao houver alert ativo similar, gera novo alerta.
// ──────────────────────────────────────────────────────────
function vigiaCheck(cityId: CityId): Alert | null {
  void cityId;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recent = db.complaints.filter(
    (c) => now - new Date(c.createdAt).getTime() < day
  );
  if (recent.length === 0) return null;

  const buckets = new Map<string, Complaint[]>();
  for (const c of recent) {
    const k = `${c.classification.category}|${c.classification.neighborhood || "?"}`;
    const list = buckets.get(k) ?? [];
    list.push(c);
    buckets.set(k, list);
  }

  // Pega o bucket mais quente
  let hottest: { key: string; list: Complaint[] } | null = null;
  for (const [key, list] of buckets) {
    if (list.length < 5) continue;
    if (!hottest || list.length > hottest.list.length) {
      hottest = { key, list };
    }
  }
  if (!hottest) return null;

  const [category, neighborhood] = hottest.key.split("|");

  // Evita duplicar: se ja tem alert nas ultimas 6h sobre essa combinacao, skip
  const sixH = 6 * 60 * 60 * 1000;
  const dup = db.alerts.find(
    (a) =>
      now - new Date(a.createdAt).getTime() < sixH &&
      a.title.includes(neighborhood) &&
      a.title.toLowerCase().includes(category.toLowerCase())
  );
  if (dup) return null;

  const level: Alert["level"] =
    hottest.list.some((c) => c.classification.urgency === "high")
      ? "critical"
      : hottest.list.length >= 8
        ? "alert"
        : "warning";

  return {
    id: newId(),
    level,
    title: `${neighborhood}: ${category} escalando`,
    description: `${hottest.list.length} sinais de "${category}" no bairro ${neighborhood} nas ultimas 24h.`,
    recommendedAction:
      category === "ar/poeira" || category === "mineradora-direto"
        ? "Reduzir frequencia de detonacao no turno da manha e reforcar molhagem das vias."
        : category === "ruido"
          ? "Restringir caminhoes em horario noturno (22h-6h) e revisar rota de acesso."
          : "Agendar reuniao com associacao do bairro nas proximas 48h.",
    createdAt: nowIso(),
  };
}

// ──────────────────────────────────────────────────────────
// Replica
// ──────────────────────────────────────────────────────────
export async function generateReplica(args: {
  trigger: ReplicaMessage["trigger"];
  citizen: Citizen;
  payload: Parameters<typeof Replica.run>[0]["payload"];
}): Promise<string> {
  return Replica.run({
    trigger: args.trigger,
    citizen: args.citizen,
    payload: args.payload,
  });
}

// ──────────────────────────────────────────────────────────
// Pacto
// ──────────────────────────────────────────────────────────
export async function generateEsg(args: {
  cityId: CityId;
  framework: ESGFramework;
  period?: string;
}): Promise<ESGReportFragment[]> {
  const out = await Pacto.run(args);
  return out.fragments;
}

// ──────────────────────────────────────────────────────────
// Semente — avalia ideia de negocio
// ──────────────────────────────────────────────────────────
export async function evaluateBusinessIdea(args: {
  citizen: Citizen;
  rawInput: string;
}): Promise<BusinessIdea> {
  return Semente.run({ citizen: args.citizen, rawInput: args.rawInput });
}
