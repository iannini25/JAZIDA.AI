// POST /api/demo/trigger/:scenario — dispara cenario de demo
//
// Cenarios (master):
//   - maria_enfermagem: roda Acolhida -> Talento -> Bussola -> Replica
//   - joaozinho_poeira: roda Voz -> Pulsar -> Vigia (entrega via Alert)
//
// Em ambos os modos, tudo passa pelo orchestrator que registra agentEvents
// no DB — entao o feed live do dashboard mostra a cadeia em tempo real.

import {
  db,
  genProtocolNumber,
  newId,
  nowIso,
  saveDb,
} from "@/lib/db";
import { badRequest, ok } from "@/lib/http";
import {
  evaluateBusinessIdea,
  generateReplica,
  onComplaintReceived,
  onTalentReceived,
} from "@/lib/orchestrator";
import type {
  Citizen,
  Complaint,
  DemoScenario,
  TalentEntry,
} from "@/types";

export const dynamic = "force-dynamic";

const SUPPORTED: DemoScenario[] = [
  "maria_enfermagem",
  "joaozinho_poeira",
  "beatriz_costura",
];

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

  if (scenario === "maria_enfermagem") return ok(await triggerMaria());
  if (scenario === "beatriz_costura") return ok(await triggerBeatriz());
  return ok(await triggerJoao());
}

function ensureCitizen(name: string, fields: Partial<Citizen>): Citizen {
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

// ──────────────────────────────────────────────────────────
// Maria — Talento + Bussola + Replica
// ──────────────────────────────────────────────────────────
async function triggerMaria() {
  const maria = ensureCitizen("Maria Aparecida", {
    age: 47,
    neighborhood: "Santo Antônio",
    occupation: "Dona de casa",
    phone: "+5531999990001",
  });

  const rawInput =
    "alo, queria saber se minha filha de 17 anos consegue uma bolsa pra estudar enfermagem";

  const talent: TalentEntry = {
    id: newId(),
    citizenId: maria.id,
    rawInput,
    type: "aspiration",
    structured: { label: rawInput.slice(0, 40), category: "outro", confidence: 0 },
    createdAt: nowIso(),
  };
  db.talents.push(talent);
  saveDb();

  // Roda Talento + Bussola (sincrono pra demo retornar dados completos)
  await onTalentReceived({ citizen: maria, talent, rawInput });

  // Espera bussola completar (await curto + polling — onTalentReceived dispara
  // bussola void, entao precisamos esperar matches aparecer ou timeout)
  await waitForMatches(talent.id, 10_000);

  // Gera Replica
  const replicaText = await generateReplica({
    trigger: "talent_matched",
    citizen: maria,
    payload: {
      originalText: rawInput,
      matches: (talent.matches || []).slice(0, 3).map((m) => ({
        title: m.title,
        cost: m.cost,
      })),
    },
  });

  return {
    scenario: "maria_enfermagem" as const,
    citizenId: maria.id,
    talent,
    replicaDraft: replicaText,
    note: "Cadeia real: Talento + Bussola + Replica.",
  };
}

async function waitForMatches(
  talentId: string,
  timeoutMs: number
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const t = db.talents.find((x) => x.id === talentId);
    if (t?.matches && t.matches.length > 0) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

// ──────────────────────────────────────────────────────────
// Joao — Voz + Pulsar + Vigia
// ──────────────────────────────────────────────────────────
async function triggerJoao() {
  const joao = ensureCitizen("Joao Pedro Silva", {
    age: 38,
    neighborhood: "Centro",
    occupation: "Padeiro",
    phone: "+5531999990002",
  });

  const rawInput =
    "o, esse po ta insuportavel, nao da pra deixar o carro na rua";

  const complaint: Complaint = {
    id: newId(),
    citizenId: joao.id,
    rawInput,
    type: "complaint",
    classification: {
      category: "outro",
      urgency: "medium",
      impact: "individual",
      neighborhood: joao.neighborhood,
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  };
  db.complaints.push(complaint);
  saveDb();

  const { alert } = await onComplaintReceived({
    citizen: joao,
    complaint,
    rawInput,
  });

  return {
    scenario: "joaozinho_poeira" as const,
    citizenId: joao.id,
    complaint,
    alert: alert ?? null,
    note: "Cadeia real: Voz + Pulsar + Vigia.",
  };
}

// ──────────────────────────────────────────────────────────
// Beatriz — Semente avalia ideia de costureira (just transition)
// ──────────────────────────────────────────────────────────
async function triggerBeatriz() {
  const beatriz = ensureCitizen("Beatriz Oliveira", {
    age: 22,
    neighborhood: "Cabanas",
    occupation: "Estudante",
    phone: "+5531999990005",
  });

  const rawInput =
    "Tava pensando em comecar a vender vestido de noiva, sei costurar e tenho uma maquina velha da minha avo. Mas nao sei se vale a pena. Tem mercado aqui?";

  const idea = await evaluateBusinessIdea({
    citizen: beatriz,
    rawInput,
  });

  return {
    scenario: "beatriz_costura" as const,
    citizenId: beatriz.id,
    idea,
    note: "Cadeia real: Semente analisa demanda + competicao + plano de acao.",
  };
}
