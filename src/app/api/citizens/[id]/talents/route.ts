// POST /api/citizens/:id/talents — registra talento
//
// Fase 1 (mock): cria entry com structured/matches placeholder.
// Fase 2: chama agent Talento + dispara Bussola assincrono.
//
// Resposta retorna 202 com `{ talentId, status: "processing" }` para que
// o frontend possa fazer polling/SSE enquanto a Bussola gera os matches.

import { db, emitAgentEvent, newId, nowIso, saveDb } from "@/lib/db";
import { badRequest, notFound, ok, safeJson } from "@/lib/http";
import type { TalentEntry, TalentType } from "@/types";

export const dynamic = "force-dynamic";

const TALENT_TYPES: TalentType[] = [
  "skill",
  "aspiration",
  "best_at",
  "want_to_learn",
];

type Body = { rawInput?: string; type?: TalentType };

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");

  const body = await safeJson<Body>(req);
  if (!body || !body.rawInput) {
    return badRequest("campo 'rawInput' obrigatorio");
  }

  const type: TalentType = TALENT_TYPES.includes(body.type as TalentType)
    ? (body.type as TalentType)
    : "aspiration";

  // Fase 1 mock — Fase 2 sobrescreve com chamada real ao agent Talento
  const talent: TalentEntry = {
    id: newId(),
    citizenId: citizen.id,
    rawInput: body.rawInput,
    type,
    structured: {
      label: body.rawInput.slice(0, 40),
      category: "outro",
      confidence: 0.5,
    },
    createdAt: nowIso(),
  };
  db.talents.push(talent);
  saveDb();

  emitAgentEvent({
    id: newId(),
    agentName: "Talento",
    citizenId: citizen.id,
    action: `Recebeu input: "${body.rawInput.slice(0, 60)}"`,
    payload: { talentId: talent.id, phase: "mock" },
    timestamp: nowIso(),
  });

  return ok(
    { talentId: talent.id, status: "processing" },
    { status: 202 }
  );
}

// GET /api/citizens/:id/talents — lista talentos
export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");
  const talents = db.talents.filter((t) => t.citizenId === ctx.params.id);
  return ok({ talents });
}
