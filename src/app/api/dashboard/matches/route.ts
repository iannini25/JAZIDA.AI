// GET /api/dashboard/matches — lista talentos com matches pendentes de aprovacao.
// POST /api/dashboard/matches — aprova ou rejeita matches de um talento.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db, saveDb, emitAgentEvent, newId, nowIso } from "@/lib/db";
import type { MatchApprovalStatus } from "@/types";

export async function GET(req: NextRequest) {
  const result = requireAuth(req, ["funcionario"]);
  if (result instanceof NextResponse) return result;

  // Retorna todos os talentos que tem matches (pendentes, aprovados ou rejeitados)
  const talents = db.talents.filter((t) => t.matches && t.matches.length > 0);

  // Enriquece com nome do cidadao
  const enriched = talents.map((t) => {
    const citizen = db.citizens.find((c) => c.id === t.citizenId);
    return {
      ...t,
      citizenName: citizen?.name || "Desconhecido",
      citizenNeighborhood: citizen?.neighborhood || "—",
    };
  });

  return NextResponse.json({
    talents: enriched,
    pendingCount: enriched.filter((t) => t.matchApprovalStatus === "pending" || !t.matchApprovalStatus).length,
    approvedCount: enriched.filter((t) => t.matchApprovalStatus === "approved").length,
    rejectedCount: enriched.filter((t) => t.matchApprovalStatus === "rejected").length,
  });
}

export async function POST(req: NextRequest) {
  const result = requireAuth(req, ["funcionario"]);
  if (result instanceof NextResponse) return result;

  const body = await req.json();
  const { talentId, status } = body as {
    talentId: string;
    status: MatchApprovalStatus;
  };

  if (!talentId || !status) {
    return NextResponse.json(
      { error: "talentId e status sao obrigatorios." },
      { status: 400 }
    );
  }

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: "status deve ser 'approved' ou 'rejected'." },
      { status: 400 }
    );
  }

  const talent = db.talents.find((t) => t.id === talentId);
  if (!talent) {
    return NextResponse.json(
      { error: "Talento nao encontrado." },
      { status: 404 }
    );
  }

  talent.matchApprovalStatus = status;
  talent.matchApprovedBy = result.user.username;
  saveDb();

  // Emite evento de agent
  emitAgentEvent({
    id: newId(),
    agentName: "Replica",
    citizenId: talent.citizenId,
    action: status === "approved"
      ? `Recomendacoes para "${talent.structured.label}" aprovadas por ${result.user.displayName}`
      : `Recomendacoes para "${talent.structured.label}" rejeitadas por ${result.user.displayName}`,
    payload: { talentId, status },
    timestamp: nowIso(),
  });

  return NextResponse.json({ ok: true, talent });
}
