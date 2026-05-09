// POST /api/citizens/:id/talents
//
// Fluxo:
//   1) cria TalentEntry placeholder com status "processing" (UX)
//   2) responde 202 com { talentId, status: "processing" } imediato
//   3) em background: orchestrator.onTalentReceived
//        -> Talento popula structured/type
//        -> Bussola popula matches[] async
//
// O frontend faz polling em GET /talents ou escuta SSE pra ver os matches
// chegando.

import { db, newId, nowIso, saveDb } from "@/lib/db";
import { badRequest, notFound, ok, safeJson } from "@/lib/http";
import { onTalentReceived } from "@/lib/orchestrator";
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

  const fallbackType: TalentType = TALENT_TYPES.includes(
    body.type as TalentType
  )
    ? (body.type as TalentType)
    : "aspiration";

  const talent: TalentEntry = {
    id: newId(),
    citizenId: citizen.id,
    rawInput: body.rawInput,
    type: fallbackType,
    structured: {
      label: body.rawInput.slice(0, 40),
      category: "outro",
      confidence: 0,
    },
    createdAt: nowIso(),
  };
  db.talents.push(talent);
  saveDb();

  // Async — nao bloqueia. Erros sao logados, talent fica com placeholder.
  void onTalentReceived({ citizen, talent, rawInput: body.rawInput });

  return ok({ talentId: talent.id, status: "processing" }, { status: 202 });
}

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");
  const talents = db.talents.filter((t) => t.citizenId === ctx.params.id);
  return ok({ talents });
}
