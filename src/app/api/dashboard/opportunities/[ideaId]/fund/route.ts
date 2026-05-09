// POST /api/dashboard/opportunities/:ideaId/fund — marca ideia como "vai financiar".
// Apenas estado: nao move dinheiro real. Atualiza status da idea + emite evento.

import { db, emitAgentEvent, newId, nowIso, saveDb } from "@/lib/db";
import { notFound, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: { ideaId: string } }
) {
  const idea = db.businessIdeas.find((i) => i.id === ctx.params.ideaId);
  if (!idea) return notFound("ideia nao encontrada");

  if (!db.fundedIdeaIds.includes(idea.id)) {
    db.fundedIdeaIds.push(idea.id);
  }
  idea.status = "submitted_to_funding";
  saveDb();

  emitAgentEvent({
    id: newId(),
    agentName: "Semente",
    citizenId: idea.citizenId,
    action: `Capital semente aprovado pra "${idea.structured.title}"`,
    payload: {
      ideaId: idea.id,
      capexMax: idea.structured.estimatedCapex.max,
    },
    timestamp: nowIso(),
  });

  return ok({
    ideaId: idea.id,
    status: idea.status,
    funded: true,
  });
}
