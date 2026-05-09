// POST /api/citizens/:id/complaints
//
// Fluxo:
//   1) cria Complaint com classificacao placeholder + protocolo
//   2) chama orchestrator.onComplaintReceived (Voz + Pulsar + Vigia)
//   3) retorna a Complaint ja classificada + alert (se Vigia disparou)

import { NextRequest, NextResponse } from "next/server";
import {
  db,
  genProtocolNumber,
  newId,
  nowIso,
  saveDb,
} from "@/lib/db";
import { badRequest, created, notFound, ok, safeJson } from "@/lib/http";
import { onComplaintReceived } from "@/lib/orchestrator";
import { authenticate } from "@/lib/api-auth";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";
import type { Complaint } from "@/types";

export const dynamic = "force-dynamic";

type Body = {
  rawInput?: string;
  type?: "complaint" | "suggestion";
  photoUrl?: string;
};

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  // Rate limit (se autenticado)
  const authCtx = authenticate(req as unknown as NextRequest);
  if (authCtx) {
    const rl = checkRateLimit(authCtx.user.id, "complaint");
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Limite atingido: ${rl.limitPerWindow} queixas por hora. Tente novamente apos ${new Date(rl.resetAt).toLocaleTimeString("pt-BR")}.`,
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

  const placeholderType =
    body.type === "suggestion" ? "suggestion" : "complaint";

  const complaint: Complaint = {
    id: newId(),
    citizenId: citizen.id,
    rawInput: body.rawInput,
    type: placeholderType,
    classification: {
      category: "outro",
      urgency: "medium",
      impact: "individual",
      neighborhood: citizen.neighborhood,
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  };
  db.complaints.push(complaint);
  saveDb();

  // Registra acao no rate limiter
  if (authCtx) {
    recordAction(authCtx.user.id, "complaint");
  }

  // Sincrono pra retornar a complaint ja classificada (Voz e rapido — 1 LLM call)
  const { alert } = await onComplaintReceived({
    citizen,
    complaint,
    rawInput: body.rawInput,
    photoUrl: body.photoUrl,
  });

  return created({ complaint, alert: alert ?? null });
}

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");
  const complaints = db.complaints.filter(
    (c) => c.citizenId === ctx.params.id
  );
  return ok({ complaints });
}
