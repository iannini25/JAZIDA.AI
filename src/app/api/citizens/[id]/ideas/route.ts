// POST /api/citizens/:id/ideas — submete ideia de negocio
// GET  /api/citizens/:id/ideas — lista ideias do cidadao
//
// Fluxo: avalia sincrono via agente Semente (1 LLM call ou fallback hardcoded
// em DEMO_SAFE). Retorna a ideia completa.

import { db } from "@/lib/db";
import { badRequest, created, notFound, ok, safeJson, serverError } from "@/lib/http";
import { evaluateBusinessIdea } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

type Body = { rawInput?: string };

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

  try {
    const idea = await evaluateBusinessIdea({
      citizen,
      rawInput: body.rawInput,
    });
    return created({ ideaId: idea.id, idea });
  } catch (err) {
    return serverError("falha ao avaliar ideia", err);
  }
}

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");
  const ideas = db.businessIdeas.filter((i) => i.citizenId === ctx.params.id);
  return ok({ ideas });
}
