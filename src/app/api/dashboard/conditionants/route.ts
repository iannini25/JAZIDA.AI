// GET /api/dashboard/conditionants — lista condicionantes ambientais/regulatorias.
//
// Suporta filtro ?cityId= e ?status=. Retorna tambem agregado pra header.

import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import type { Conditionant, ConditionantStatus, CityId } from "@/types";

export const dynamic = "force-dynamic";

const VALID_STATUS: ConditionantStatus[] = ["em-prazo", "em-risco", "vencida"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityId = url.searchParams.get("cityId") as CityId | null;
  const status = url.searchParams.get("status") as ConditionantStatus | null;

  let list: Conditionant[] = db.conditionants;
  if (cityId) list = list.filter((c) => c.cityId === cityId);
  if (status && VALID_STATUS.includes(status)) {
    list = list.filter((c) => c.status === status);
  }

  // Ordena: vencida -> em-risco -> em-prazo (criticidade) e depois por deadline
  const order: Record<ConditionantStatus, number> = {
    vencida: 0,
    "em-risco": 1,
    "em-prazo": 2,
  };
  list = [...list].sort((a, b) => {
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Agregado pra mostrar no header do dashboard
  const summary = {
    total: list.length,
    emPrazo: list.filter((c) => c.status === "em-prazo").length,
    emRisco: list.filter((c) => c.status === "em-risco").length,
    vencidas: list.filter((c) => c.status === "vencida").length,
    nextDeadline: list[0]?.deadline,
  };

  return ok({ conditionants: list, summary });
}
