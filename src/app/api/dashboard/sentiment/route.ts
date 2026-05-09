// GET /api/dashboard/sentiment — snapshot atual de sentimento
//
// Tipo SentimentSnapshot do master:
//   { current: -1..+1, trend: up|down|stable, topThemes, byNeighborhood, generatedAt }
//
// Fase 1: heuristica simples a partir das complaints. Fase 2: agente Pulsar.

import { db, nowIso } from "@/lib/db";
import { ok } from "@/lib/http";
import type { CityId, Complaint, SentimentSnapshot } from "@/types";

export const dynamic = "force-dynamic";

const VALID_CITIES: CityId[] = ["mariana", "itabira", "paracatu", "araxa"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityIdParam = url.searchParams.get("cityId") as CityId | null;
  const cityId: CityId = (cityIdParam && VALID_CITIES.includes(cityIdParam)
    ? cityIdParam
    : "mariana") as CityId;

  const cached = db.sentimentByCity[cityId];
  if (
    cached &&
    Date.now() - new Date(cached.generatedAt).getTime() < 30_000
  ) {
    return ok(cached);
  }

  const snapshot = computeSnapshot(cityId);
  db.sentimentByCity[cityId] = snapshot;
  return ok(snapshot);
}

function computeSnapshot(cityId: CityId): SentimentSnapshot {
  // Filtra complaints da cidade (single-tenant — todas hoje sao mariana)
  const cityCitizens = new Set(
    db.citizens.filter((c) => c.cityId === cityId).map((c) => c.id)
  );
  const complaints: Complaint[] = db.complaints.filter((c) =>
    cityCitizens.has(c.citizenId)
  );

  if (complaints.length === 0) {
    return {
      current: 0,
      trend: "stable",
      topThemes: [],
      byNeighborhood: [],
      generatedAt: nowIso(),
    };
  }

  // Score por sinal: suggestion=+0.5, complaint low=-0.2, medium=-0.5, high=-0.9
  const scoreOf = (c: Complaint): number => {
    if (c.type === "suggestion") return 0.5;
    if (c.classification.urgency === "high") return -0.9;
    if (c.classification.urgency === "medium") return -0.5;
    return -0.2;
  };

  const totalScore = complaints.reduce((s, c) => s + scoreOf(c), 0);
  const current = clamp(totalScore / complaints.length, -1, 1);

  // Trend: compara metade mais recente vs metade mais antiga (heuristica)
  const sorted = [...complaints].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const half = Math.floor(sorted.length / 2) || 1;
  const oldHalf = sorted.slice(0, half);
  const newHalf = sorted.slice(-half);
  const oldAvg =
    oldHalf.reduce((s, c) => s + scoreOf(c), 0) / oldHalf.length;
  const newAvg =
    newHalf.reduce((s, c) => s + scoreOf(c), 0) / newHalf.length;
  const trend: SentimentSnapshot["trend"] =
    newAvg < oldAvg - 0.1
      ? "down"
      : newAvg > oldAvg + 0.1
        ? "up"
        : "stable";

  // Top themes (categorias)
  const themeBuckets = new Map<
    string,
    { sum: number; count: number }
  >();
  for (const c of complaints) {
    const k = c.classification.category;
    const b = themeBuckets.get(k) ?? { sum: 0, count: 0 };
    b.sum += scoreOf(c);
    b.count += 1;
    themeBuckets.set(k, b);
  }
  const topThemes = [...themeBuckets.entries()]
    .map(([label, b]) => ({
      label,
      sentiment: clamp(b.sum / b.count, -1, 1),
      count: b.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Por bairro
  const hoodBuckets = new Map<
    string,
    { sum: number; count: number }
  >();
  for (const c of complaints) {
    const k = c.classification.neighborhood || "Sem bairro";
    const b = hoodBuckets.get(k) ?? { sum: 0, count: 0 };
    b.sum += scoreOf(c);
    b.count += 1;
    hoodBuckets.set(k, b);
  }
  const byNeighborhood = [...hoodBuckets.entries()]
    .map(([name, b]) => ({
      name,
      sentiment: clamp(b.sum / b.count, -1, 1),
    }))
    .sort((a, b) => a.sentiment - b.sentiment); // pior primeiro

  return {
    current: round(current, 3),
    trend,
    topThemes,
    byNeighborhood,
    generatedAt: nowIso(),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round(v: number, decimals: number): number {
  const k = 10 ** decimals;
  return Math.round(v * k) / k;
}
