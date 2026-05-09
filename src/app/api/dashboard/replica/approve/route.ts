// POST /api/dashboard/replica/approve — aprova mensagem de Replica e dispara
//
// Body: { citizenId, message, trigger?, triggerId?, approvedBy? }
// Fase 1 (mock): registra como sent imediato com texto recebido.
// Fase 2: se message ausente, chama agente Replica pra gerar.

import { db, emitAgentEvent, newId, nowIso, saveDb } from "@/lib/db";
import { badRequest, created, notFound, safeJson } from "@/lib/http";
import type { ReplicaMessage } from "@/types";

export const dynamic = "force-dynamic";

type Body = {
  citizenId?: string;
  trigger?: ReplicaMessage["trigger"];
  triggerId?: string;
  message?: string;
  approvedBy?: string;
};

export async function POST(req: Request) {
  const body = await safeJson<Body>(req);
  if (!body || !body.citizenId || !body.message) {
    return badRequest("campos 'citizenId' e 'message' obrigatorios");
  }
  const citizen = db.citizens.find((c) => c.id === body.citizenId);
  if (!citizen) return notFound("cidadao nao encontrado");

  const replica: ReplicaMessage = {
    id: newId(),
    citizenId: citizen.id,
    trigger: body.trigger || "manual",
    triggerId: body.triggerId,
    message: body.message,
    approvedBy: body.approvedBy,
    status: "sent",
    createdAt: nowIso(),
    sentAt: nowIso(),
  };
  db.replicas.push(replica);
  saveDb();

  emitAgentEvent({
    id: newId(),
    agentName: "Replica",
    citizenId: citizen.id,
    action: `Mensagem aprovada e enviada para ${citizen.name}`,
    payload: {
      replicaId: replica.id,
      preview: body.message.slice(0, 100),
      approvedBy: body.approvedBy,
    },
    timestamp: nowIso(),
  });

  return created(replica);
}
