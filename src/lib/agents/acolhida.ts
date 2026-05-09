// Agent Acolhida — onboarding + roteamento inicial.
//
// Recebe a primeira fala do cidadao, tenta extrair nome/idade/bairro/ocupacao
// e decide proximo agent (Talento ou Voz). Se cidadao ja existe (citizenId),
// reusa.
//
// LLM output (per prompt 01):
//   { extracted: {name?, age?, neighborhood?, occupation?},
//     intent: "talento" | "voz" | "outro",
//     responseToCitizen: string }
//
// Agent run() retorna { citizen, nextAgent, responseToCitizen }.

import { db, emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_ACOLHIDA } from "@/lib/agents/prompts";
import type { Citizen, CityId } from "@/types";

export type AcolhidaInput = {
  rawInput: string;
  citizenId?: string;
  cityId?: CityId;
};

export type AcolhidaOutput = {
  citizen: Citizen;
  nextAgent: "Talento" | "Voz" | null;
  responseToCitizen: string;
};

type RawAcolhida = {
  extracted?: {
    name?: string;
    age?: number;
    neighborhood?: string;
    occupation?: string;
  };
  intent?: "talento" | "voz" | "outro";
  responseToCitizen?: string;
};

export async function run(input: AcolhidaInput): Promise<AcolhidaOutput> {
  const t0 = Date.now();
  const cityId: CityId = input.cityId || "mariana";

  // Reusa cidadao existente se id veio
  let citizen = input.citizenId
    ? db.citizens.find((c) => c.id === input.citizenId)
    : undefined;

  let raw: RawAcolhida;
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    raw = fallback(input.rawInput);
    usedFallback = true;
  } else {
    try {
      raw = await callClaudeJson<RawAcolhida>({
        system: PROMPT_ACOLHIDA.replace("{city}", cityId),
        messages: [{ role: "user", content: input.rawInput }],
        maxTokens: 600,
      });
    } catch (err) {
      console.warn("[acolhida] LLM falhou, usando fallback:", err);
      raw = fallback(input.rawInput);
      usedFallback = true;
    }
  }

  // Cria ou enriquece cidadao
  if (!citizen) {
    citizen = {
      id: newId(),
      cityId,
      name: raw.extracted?.name || "Visitante",
      age: raw.extracted?.age,
      neighborhood: raw.extracted?.neighborhood,
      occupation: raw.extracted?.occupation,
      createdAt: nowIso(),
    };
    db.citizens.push(citizen);
  } else {
    citizen.age = citizen.age ?? raw.extracted?.age;
    citizen.neighborhood =
      citizen.neighborhood ?? raw.extracted?.neighborhood;
    citizen.occupation = citizen.occupation ?? raw.extracted?.occupation;
  }

  const intent = raw.intent || "outro";
  const nextAgent: AcolhidaOutput["nextAgent"] =
    intent === "talento" ? "Talento" : intent === "voz" ? "Voz" : null;

  const ms = Date.now() - t0;
  logAgentCall(
    "Acolhida",
    ms,
    usedFallback ? "fallback" : "ok",
    { intent, citizenId: citizen.id }
  );
  emitAgentEvent({
    id: newId(),
    agentName: "Acolhida",
    citizenId: citizen.id,
    action: `Recebeu primeiro contato — intent=${intent}`,
    payload: { extracted: raw.extracted, fallback: usedFallback },
    timestamp: nowIso(),
  });

  return {
    citizen,
    nextAgent,
    responseToCitizen:
      raw.responseToCitizen ||
      "Oi! Bom te ver por aqui. Conta o que você quer compartilhar.",
  };
}

// ──────────────────────────────────────────────────────────
// Fallback DEMO_SAFE — extracao por palavra-chave.
// ──────────────────────────────────────────────────────────
function fallback(rawInput: string): RawAcolhida {
  const lower = rawInput.toLowerCase();
  const wantsTalent =
    /(quer(o|ia)|sonh|aprender|estudar|curso|trabalhar|me formar)/.test(
      lower
    );
  const wantsVoice =
    /(reclam|queixa|problema|barulho|poeira|sujeira|denuncia|sugest)/.test(
      lower
    );

  return {
    extracted: {},
    intent: wantsTalent
      ? "talento"
      : wantsVoice
        ? "voz"
        : "outro",
    responseToCitizen:
      "Beleza, te entendi. Vou te ajudar a registrar isso, ta?",
  };
}
