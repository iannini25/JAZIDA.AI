// Agent Pulsar — agrega sentimento da cidade.
//
// Tem dois caminhos:
//   - LLM (interpreta as queixas e devolve snapshot)
//   - Heuristica deterministica (fallback / DEMO_SAFE / quando volume e grande)
//
// O calculo deterministico ja existe em /api/dashboard/sentiment, mas duplicamos
// aqui pra que o orchestrator possa atualizar o cache em momentos especificos
// (ex: apos novo complaint, apos trigger de demo).

import { db, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_PULSAR } from "@/lib/agents/prompts";
import type { CityId, Complaint, SentimentSnapshot } from "@/types";

export type PulsarInput = {
  cityId: CityId;
  // Se true, forca uso do LLM mesmo com poucos sinais. Default false.
  useLlm?: boolean;
};

export async function run(input: PulsarInput): Promise<SentimentSnapshot> {
  const t0 = Date.now();
  const cityId = input.cityId;

  // Coleta os sinais da cidade
  const cityCitizens = new Set(
    db.citizens.filter((c) => c.cityId === cityId).map((c) => c.id)
  );
  const complaints = db.complaints.filter((c) =>
    cityCitizens.has(c.citizenId)
  );

  let snapshot: SentimentSnapshot;
  let usedFallback = true; // default deterministico

  if (
    input.useLlm &&
    hasApiKey() &&
    !isDemoSafe() &&
    complaints.length > 0
  ) {
    try {
      const userMsg = buildUserMessage(complaints);
      const raw = await callClaudeJson<SentimentSnapshot>({
        system: PROMPT_PULSAR,
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 800,
      });
      snapshot = sanitize(raw, cityId);
      usedFallback = false;
    } catch (err) {
      console.warn("[pulsar] LLM falhou, usando heuristica:", err);
      snapshot = heuristic(complaints);
    }
  } else {
    snapshot = heuristic(complaints);
  }

  // Atualiza cache
  db.sentimentByCity[cityId] = snapshot;

  const ms = Date.now() - t0;
  logAgentCall("Pulsar", ms, usedFallback ? "fallback" : "ok", {
    cityId,
    current: snapshot.current,
    trend: snapshot.trend,
    themes: snapshot.topThemes.length,
  });

  return snapshot;
}

function buildUserMessage(complaints: Complaint[]): string {
  const lines = complaints.slice(0, 50).map((c) => {
    const cls = c.classification;
    return `- [${cls.urgency}] ${c.type} | ${cls.category} | ${cls.neighborhood || "?"} :: ${c.rawInput.slice(0, 100)}`;
  });
  return [
    `Total de sinais: ${complaints.length}`,
    `Mostrando ate 50:`,
    ...lines,
    ``,
    `Calcule o snapshot de sentimento da cidade conforme o formato pedido.`,
  ].join("\n");
}

function sanitize(
  raw: Partial<SentimentSnapshot>,
  cityId: CityId
): SentimentSnapshot {
  void cityId;
  const current = clamp(typeof raw.current === "number" ? raw.current : 0, -1, 1);
  const trend: SentimentSnapshot["trend"] =
    raw.trend === "up" || raw.trend === "down" || raw.trend === "stable"
      ? raw.trend
      : "stable";
  const topThemes = (raw.topThemes || [])
    .filter((t) => t && typeof t.label === "string")
    .map((t) => ({
      label: String(t.label),
      sentiment: clamp(Number(t.sentiment) || 0, -1, 1),
      count: Math.max(0, Math.round(Number(t.count) || 0)),
    }))
    .slice(0, 5);
  const byNeighborhood = (raw.byNeighborhood || [])
    .filter((n) => n && typeof n.name === "string")
    .map((n) => ({
      name: String(n.name),
      sentiment: clamp(Number(n.sentiment) || 0, -1, 1),
    }));
  return {
    current,
    trend,
    topThemes,
    byNeighborhood,
    generatedAt: nowIso(),
  };
}

// ──────────────────────────────────────────────────────────
// Heuristica deterministica (sempre funciona, sem LLM)
// ──────────────────────────────────────────────────────────
function heuristic(complaints: Complaint[]): SentimentSnapshot {
  if (complaints.length === 0) {
    return {
      current: 0,
      trend: "stable",
      topThemes: [],
      byNeighborhood: [],
      generatedAt: nowIso(),
    };
  }

  const scoreOf = (c: Complaint): number => {
    if (c.type === "suggestion") return 0.5;
    if (c.classification.urgency === "high") return -0.9;
    if (c.classification.urgency === "medium") return -0.5;
    return -0.2;
  };

  const totalScore = complaints.reduce((s, c) => s + scoreOf(c), 0);
  const current = clamp(totalScore / complaints.length, -1, 1);

  const sorted = [...complaints].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const half = Math.floor(sorted.length / 2) || 1;
  const oldHalf = sorted.slice(0, half);
  const newHalf = sorted.slice(-half);
  const oldAvg = oldHalf.reduce((s, c) => s + scoreOf(c), 0) / oldHalf.length;
  const newAvg = newHalf.reduce((s, c) => s + scoreOf(c), 0) / newHalf.length;
  const trend: SentimentSnapshot["trend"] =
    newAvg < oldAvg - 0.1
      ? "down"
      : newAvg > oldAvg + 0.1
        ? "up"
        : "stable";

  const themeBuckets = new Map<string, { sum: number; count: number }>();
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

  const hoodBuckets = new Map<string, { sum: number; count: number }>();
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
    .sort((a, b) => a.sentiment - b.sentiment);

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
function round(v: number, d: number): number {
  const k = 10 ** d;
  return Math.round(v * k) / k;
}
