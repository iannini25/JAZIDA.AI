// GET /api/dashboard/municipal-indicators?cityId= — indicadores externos
// (IBGE / INEP / ANM CFEM / DataSUS). Hardcoded no MVP.

import { ok, badRequest } from "@/lib/http";
import {
  getMunicipalIndicators,
  listAllIndicators,
} from "@/lib/external/municipal-indicators";
import type { CityId } from "@/types";

export const dynamic = "force-dynamic";

const VALID_CITIES: CityId[] = ["mariana", "itabira", "paracatu", "araxa"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityIdParam = url.searchParams.get("cityId") as CityId | null;

  if (!cityIdParam) {
    return ok({ indicators: listAllIndicators() });
  }
  if (!VALID_CITIES.includes(cityIdParam)) {
    return badRequest(`cityId invalido. esperado: ${VALID_CITIES.join(", ")}`);
  }
  const data = getMunicipalIndicators(cityIdParam);
  if (!data) return ok({ indicators: null });
  return ok(data);
}
