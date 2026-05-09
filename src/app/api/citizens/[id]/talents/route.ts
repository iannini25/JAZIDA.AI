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

import { NextRequest, NextResponse } from "next/server";
import { db, newId, nowIso, saveDb } from "@/lib/db";
import { badRequest, notFound, ok, safeJson } from "@/lib/http";
import { onTalentReceived } from "@/lib/orchestrator";
import { authenticate } from "@/lib/api-auth";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";
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
  // Rate limit (se autenticado)
  const authCtx = authenticate(req as unknown as NextRequest);
  if (authCtx) {
    const rl = checkRateLimit(authCtx.user.id, "talent");
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Limite atingido: ${rl.limitPerWindow} talentos por hora. Tente novamente apos ${new Date(rl.resetAt).toLocaleTimeString("pt-BR")}.`,
          rateLimit: rl,
        },
        { status: 429 }
      );
    }
  }

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
    matchApprovalStatus: "pending", // matches precisam aprovacao no dashboard
    createdAt: nowIso(),
  };
  db.talents.push(talent);
  saveDb();

  // Registra acao no rate limiter
  if (authCtx) {
    recordAction(authCtx.user.id, "talent");
  }

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
