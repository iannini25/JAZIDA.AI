// Agent Voz — classifica queixas e sugestoes.
//
// LLM output (prompt 01): { type, category, urgency, impact, neighborhood }
// Output do agent: Complaint["classification"] + type (que vai pro top do Complaint).

import { emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_VOZ } from "@/lib/agents/prompts";
import type {
  Citizen,
  Complaint,
  ComplaintImpact,
  ComplaintType,
  ComplaintUrgency,
} from "@/types";

export type VozInput = {
  rawInput: string;
  citizen: Citizen;
  photoUrl?: string;
};

export type VozOutput = {
  type: ComplaintType;
  classification: Complaint["classification"];
};

type RawVoz = {
  type?: ComplaintType;
  category?: string;
  urgency?: ComplaintUrgency;
  impact?: ComplaintImpact;
  neighborhood?: string;
};

export async function run(input: VozInput): Promise<VozOutput> {
  const t0 = Date.now();

  // Se vier foto, mencionamos no prompt — sem visao real por enquanto
  const userMessage = input.photoUrl
    ? `${input.rawInput}\n\n[foto anexada: ${input.photoUrl}]`
    : input.rawInput;

  let raw: RawVoz;
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    raw = fallback(input.rawInput, input.citizen);
    usedFallback = true;
  } else {
    try {
      raw = await callClaudeJson<RawVoz>({
        system: PROMPT_VOZ,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 300,
      });
    } catch (err) {
      console.warn("[voz] LLM falhou, fallback:", err);
      raw = fallback(input.rawInput, input.citizen);
      usedFallback = true;
    }
  }

  const type: ComplaintType =
    raw.type === "suggestion" ? "suggestion" : "complaint";
  let urgency: ComplaintUrgency =
    raw.urgency && ["low", "medium", "high"].includes(raw.urgency)
      ? raw.urgency
      : "medium";
  // mineradora-direto e sempre high (regra do prompt)
  if (raw.category === "mineradora-direto") urgency = "high";

  const out: VozOutput = {
    type,
    classification: {
      category: (raw.category || "outro").trim(),
      urgency,
      impact:
        raw.impact === "individual" || raw.impact === "collective"
          ? raw.impact
          : "individual",
      neighborhood: raw.neighborhood || input.citizen.neighborhood,
    },
  };

  const ms = Date.now() - t0;
  logAgentCall("Voz", ms, usedFallback ? "fallback" : "ok", {
    type: out.type,
    category: out.classification.category,
    urgency: out.classification.urgency,
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Voz",
    citizenId: input.citizen.id,
    action: `Classificou ${out.type}: ${out.classification.category} (${out.classification.urgency})`,
    payload: { neighborhood: out.classification.neighborhood, fallback: usedFallback },
    timestamp: nowIso(),
  });

  return out;
}

function fallback(rawInput: string, citizen: Citizen): RawVoz {
  const lower = rawInput.toLowerCase();
  const isSuggestion = /(sugest|devia ter|seria bom|deveriamos)/.test(lower);
  let category = "outro";
  if (/(poeira|po|fuligem|detonacao)/.test(lower))
    category = "mineradora-direto";
  else if (/(barulho|ruido|caminhao)/.test(lower)) category = "ruido";
  else if (/(agua|esgoto|saneamento)/.test(lower)) category = "agua";
  else if (/(transito|estrada|asfalto)/.test(lower)) category = "estradas";
  else if (/(saude|hospital|posto)/.test(lower)) category = "saude-publica";
  else if (/(escola|educacao|aula)/.test(lower)) category = "educacao-publica";

  const urgency: ComplaintUrgency =
    /insuportavel|nao da|crianca|saude|risco|urgente/.test(lower)
      ? "high"
      : "medium";

  return {
    type: isSuggestion ? "suggestion" : "complaint",
    category,
    urgency,
    impact: /todo mundo|coletivo|bairro|cidade/.test(lower)
      ? "collective"
      : "individual",
    neighborhood: citizen.neighborhood,
  };
}
