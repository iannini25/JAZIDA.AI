// GET /api/dashboard/sentiment — snapshot de sentimento da cidade
//
// Roda agente Pulsar (heuristica deterministica por padrao; LLM se ?live=1).
// Cache de 30s por cidade.

import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import { Pulsar } from "@/lib/orchestrator";
import type { CityId } from "@/types";

export const dynamic = "force-dynamic";

const VALID_CITIES: CityId[] = ["mariana", "itabira", "paracatu", "araxa"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityIdParam = url.searchParams.get("cityId") as CityId | null;
  const live = url.searchParams.get("live") === "1";
  const cityId: CityId = (cityIdParam && VALID_CITIES.includes(cityIdParam)
    ? cityIdParam
    : "mariana") as CityId;

  const cached = db.sentimentByCity[cityId];
  if (
    !live &&
    cached &&
    Date.now() - new Date(cached.generatedAt).getTime() < 30_000
  ) {
    return ok(cached);
  }

  const snapshot = await Pulsar.run({ cityId, useLlm: live });
  return ok(snapshot);
}
