// POST /api/demo/trigger/:scenario — dispara cenario de demo
//
// Cenarios (do master):
//   - maria_enfermagem: Talento + Bussola + Replica
//   - joaozinho_poeira: Voz + Pulsar + Vigia (Vigia entrega via Alert)
//
// Fase 1 (mock): cria/recupera cidadao + emite eventos representativos.
// Fase 3: cadeia completa de agents reais.

import {
  db,
  emitAgentEvent,
  genProtocolNumber,
  newId,
  nowIso,
  saveDb,
} from "@/lib/db";
import { badRequest, ok } from "@/lib/http";
import type { Alert, Citizen, Complaint, DemoScenario } from "@/types";

export const dynamic = "force-dynamic";

const SUPPORTED: DemoScenario[] = ["maria_enfermagem", "joaozinho_poeira"];

export async function POST(
  _req: Request,
  ctx: { params: { scenario: string } }
) {
  const { scenario } = ctx.params;
  if (!SUPPORTED.includes(scenario as DemoScenario)) {
    return badRequest(
      `scenario invalido. suportados: ${SUPPORTED.join(", ")}`
    );
  }

  if (scenario === "maria_enfermagem") return ok(triggerMaria());
  return ok(triggerJoao());
}

function ensureCitizen(
  name: string,
  fields: Partial<Citizen>
): Citizen {
  const existing = db.citizens.find((c) => c.name === name);
  if (existing) return existing;
  const novo: Citizen = {
    id: newId(),
    cityId: "mariana",
    name,
    createdAt: nowIso(),
    ...fields,
  };
  db.citizens.push(novo);
  saveDb();
  return novo;
}

function triggerMaria() {
  const maria = ensureCitizen("Maria Aparecida", {
    age: 47,
    neighborhood: "Santo Antonio",
    occupation: "Dona de casa",
    phone: "+5531999990001",
  });

  const eventIds: string[] = [];
  const push = (e: Parameters<typeof emitAgentEvent>[0]) => {
    emitAgentEvent(e);
    eventIds.push(e.id);
  };

  push({
    id: newId(),
    agentName: "Acolhida",
    citizenId: maria.id,
    action: "Primeiro contato: identificou intent=talento (filha 17 anos)",
    timestamp: nowIso(),
  });
  push({
    id: newId(),
    agentName: "Talento",
    citizenId: maria.id,
    action:
      "Estruturou aspiracao: enfermagem (saude, conf 0.92) — para filha de 17",
    timestamp: nowIso(),
  });
  push({
    id: newId(),
    agentName: "Bussola",
    citizenId: maria.id,
    action:
      "3 matches: SENAI Mariana, Hospital Monsenhor Horta, Sebrae Saude Domiciliar",
    timestamp: nowIso(),
  });
  push({
    id: newId(),
    agentName: "Replica",
    citizenId: maria.id,
    action:
      'Draft pronto: "Maria, achei 3 caminhos pra sua filha. A Vale Fundacao tem bolsa pro tecnico SENAI - quer que eu ja faca pre-cadastro?"',
    timestamp: nowIso(),
  });

  return {
    scenario: "maria_enfermagem" as const,
    citizenId: maria.id,
    eventIds,
    note: "Fase 1: eventos mock. Fase 3 plugara agents reais.",
  };
}

function triggerJoao() {
  const joao = ensureCitizen("Joao Pedro Silva", {
    age: 38,
    neighborhood: "Centro",
    occupation: "Padeiro",
    phone: "+5531999990002",
  });

  // Adiciona uma queixa NOVA pro cenario disparar (alem das do seed)
  const novaQueixa: Complaint = {
    id: newId(),
    citizenId: joao.id,
    rawInput:
      "o, esse po ta insuportavel hoje, nao da pra deixar o carro na rua",
    type: "complaint",
    classification: {
      category: "ar/poeira",
      urgency: "medium",
      impact: "collective",
      neighborhood: "Centro",
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  };
  db.complaints.push(novaQueixa);

  // Alerta novo do Vigia (entregue via Alert do dashboard)
  const novoAlerta: Alert = {
    id: newId(),
    level: "alert",
    title: "ATENCAO Centro — poeira escalando",
    description:
      "8a queixa de poeira no Centro essa semana (+40% vs base). Risco reputacional crescente.",
    recommendedAction:
      "Agendar reuniao com associacao do bairro em 48h e acionar molhagem reforcada das vias.",
    createdAt: nowIso(),
  };
  db.alerts.push(novoAlerta);
  saveDb();

  const eventIds: string[] = [];
  const push = (e: Parameters<typeof emitAgentEvent>[0]) => {
    emitAgentEvent(e);
    eventIds.push(e.id);
  };

  push({
    id: newId(),
    agentName: "Voz",
    citizenId: joao.id,
    action:
      "Classificou queixa: ar/poeira, urgencia media, Centro (foto + texto)",
    payload: { complaintId: novaQueixa.id },
    timestamp: nowIso(),
  });
  push({
    id: newId(),
    agentName: "Pulsar",
    action: "Tema 'ar/poeira' subiu 40% no Centro (8 sinais em 24h)",
    payload: {
      theme: "ar/poeira",
      neighborhood: "Centro",
      deltaPct: 40,
    },
    timestamp: nowIso(),
  });
  // Vigia conceitual — dispara via Alert (nao tem agentName proprio)
  // Logamos como Pulsar pq Vigia roda em cima do Pulsar
  push({
    id: newId(),
    agentName: "Pulsar",
    action:
      "ALERTA gerado para dashboard: Centro com risco reputacional crescente",
    payload: { alertId: novoAlerta.id, level: "alert" },
    timestamp: nowIso(),
  });

  return {
    scenario: "joaozinho_poeira" as const,
    citizenId: joao.id,
    complaintId: novaQueixa.id,
    alertId: novoAlerta.id,
    eventIds,
    note: "Fase 1: eventos mock + queixa + alerta reais no DB.",
  };
}
