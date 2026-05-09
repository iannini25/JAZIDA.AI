// Agent Talento — estrutura habilidades/sonhos/aspiracoes.
//
// LLM output: { label, category, type, confidence }
// Tipo do master TalentEntry tem `type` no top-level e `structured: {label, category, confidence}`,
// entao o agent retorna o output ajustado pra match do tipo.

import { emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_TALENTO } from "@/lib/agents/prompts";
import type { Citizen, TalentEntry, TalentType } from "@/types";

export type TalentoInput = {
  rawInput: string;
  citizen: Citizen;
};

export type TalentoOutput = {
  type: TalentType;
  structured: TalentEntry["structured"];
};

type RawTalento = {
  label?: string;
  category?: string;
  type?: TalentType;
  confidence?: number;
};

const VALID_TYPES: TalentType[] = [
  "skill",
  "aspiration",
  "best_at",
  "want_to_learn",
];

export async function run(input: TalentoInput): Promise<TalentoOutput> {
  const t0 = Date.now();

  let raw: RawTalento;
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    raw = fallback(input.rawInput);
    usedFallback = true;
  } else {
    try {
      raw = await callClaudeJson<RawTalento>({
        system: PROMPT_TALENTO,
        messages: [{ role: "user", content: input.rawInput }],
        maxTokens: 300,
      });
    } catch (err) {
      console.warn("[talento] LLM falhou, fallback:", err);
      raw = fallback(input.rawInput);
      usedFallback = true;
    }
  }

  const type: TalentType = VALID_TYPES.includes(raw.type as TalentType)
    ? (raw.type as TalentType)
    : "aspiration";
  const out: TalentoOutput = {
    type,
    structured: {
      label: (raw.label || input.rawInput.slice(0, 40)).trim(),
      category: (raw.category || "outro").trim(),
      confidence: clamp01(raw.confidence ?? 0.5),
    },
  };

  const ms = Date.now() - t0;
  logAgentCall("Talento", ms, usedFallback ? "fallback" : "ok", {
    label: out.structured.label,
    type: out.type,
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Talento",
    citizenId: input.citizen.id,
    action: `Estruturou ${out.type}: ${out.structured.label} (${out.structured.category})`,
    payload: { confidence: out.structured.confidence, fallback: usedFallback },
    timestamp: nowIso(),
  });

  return out;
}

function clamp01(n: number): number {
  if (Number.isNaN(n) || typeof n !== "number") return 0.5;
  return Math.max(0, Math.min(1, n));
}

function fallback(raw: string): RawTalento {
  const lower = raw.toLowerCase();
  // pega primeira palavra significativa
  const word = lower.match(/[a-zçãéáíóúâêô]{4,}/)?.[0] || "talento";
  let category = "outro";
  if (/enferm|saude|hospital|cuidar/.test(lower)) category = "saude";
  else if (/cost|bord|art|musica|cultur/.test(lower)) category = "arte/cultura";
  else if (/program|tecn|comput|software/.test(lower)) category = "tecnico";
  else if (/cozinh|padar|comerc|vend/.test(lower)) category = "comercio";
  else if (/escol|professor|educ/.test(lower)) category = "educacao";

  let type: TalentType = "aspiration";
  if (/(faco|ja sei|trabalho|sou|atuo)/.test(lower)) type = "skill";
  else if (/(quero aprender|aprender)/.test(lower)) type = "want_to_learn";
  else if (/(melhor|bom em|talento)/.test(lower)) type = "best_at";

  return { label: word, category, type, confidence: 0.6 };
}
