// POST /api/citizens/:id/complaints — registra queixa/sugestao
//
// Fase 1 (mock): classifica como complaint generica + protocolo gerado.
// Fase 2: chama Voz + Pulsar + Vigia.

import {
  db,
  emitAgentEvent,
  genProtocolNumber,
  newId,
  nowIso,
  saveDb,
} from "@/lib/db";
import { badRequest, created, notFound, ok, safeJson } from "@/lib/http";
import type { Complaint } from "@/types";

export const dynamic = "force-dynamic";

type Body = {
  rawInput?: string;
  type?: "complaint" | "suggestion";
};

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

  const type = body.type === "suggestion" ? "suggestion" : "complaint";

  const complaint: Complaint = {
    id: newId(),
    citizenId: citizen.id,
    rawInput: body.rawInput,
    type,
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

  emitAgentEvent({
    id: newId(),
    agentName: "Voz",
    citizenId: citizen.id,
    action: `Recebeu ${type}: "${body.rawInput.slice(0, 60)}"`,
    payload: { complaintId: complaint.id, phase: "mock" },
    timestamp: nowIso(),
  });

  return created(complaint);
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
