// GET /api/citizens/:id/history — timeline unificado (talents + complaints + replicas)
import { db } from "@/lib/db";
import { notFound, ok } from "@/lib/http";
import type { CitizenHistory, HistoryItem } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");

  const items: HistoryItem[] = [
    ...db.talents
      .filter((t) => t.citizenId === ctx.params.id)
      .map<HistoryItem>((data) => ({ kind: "talent", data })),
    ...db.complaints
      .filter((c) => c.citizenId === ctx.params.id)
      .map<HistoryItem>((data) => ({ kind: "complaint", data })),
    ...db.replicas
      .filter((r) => r.citizenId === ctx.params.id)
      .map<HistoryItem>((data) => ({ kind: "replica", data })),
    ...db.businessIdeas
      .filter((i) => i.citizenId === ctx.params.id)
      .map<HistoryItem>((data) => ({ kind: "idea", data })),
  ].sort((a, b) => {
    const da = new Date(a.data.createdAt).getTime();
    const db2 = new Date(b.data.createdAt).getTime();
    return db2 - da;
  });

  const payload: CitizenHistory = { citizen, items };
  return ok(payload);
}
