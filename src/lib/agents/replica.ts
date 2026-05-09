// Agent Replica — gera mensagem personalizada de retorno.
//
// LLM output: TEXTO PURO (sem JSON). 3-4 frases pra WhatsApp.

import { emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaude,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_REPLICA } from "@/lib/agents/prompts";
import type { Citizen, ReplicaMessage } from "@/types";

export type ReplicaInput = {
  trigger: ReplicaMessage["trigger"];
  citizen: Citizen;
  // payload contextual: a queixa/talento original + a acao tomada
  payload: {
    originalText?: string;
    action?: string;
    nextStep?: string;
    matches?: { title: string; cost?: string }[];
    protocolNumber?: string;
  };
};

export async function run(input: ReplicaInput): Promise<string> {
  const t0 = Date.now();

  let text: string;
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    text = fallback(input);
    usedFallback = true;
  } else {
    try {
      const userMsg = buildUserMessage(input);
      const result = await callClaude({
        system: PROMPT_REPLICA,
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 400,
      });
      text = result.text.trim();
      if (!text) {
        text = fallback(input);
        usedFallback = true;
      }
    } catch (err) {
      console.warn("[replica] LLM falhou, fallback:", err);
      text = fallback(input);
      usedFallback = true;
    }
  }

  const ms = Date.now() - t0;
  logAgentCall("Replica", ms, usedFallback ? "fallback" : "ok", {
    trigger: input.trigger,
    citizenId: input.citizen.id,
    chars: text.length,
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Replica",
    citizenId: input.citizen.id,
    action: `Mensagem gerada (${input.trigger}, ${text.length} chars)`,
    payload: { preview: text.slice(0, 120), fallback: usedFallback },
    timestamp: nowIso(),
  });

  return text;
}

function buildUserMessage(input: ReplicaInput): string {
  const lines: string[] = [
    `Cidadao: ${input.citizen.name} (${input.citizen.neighborhood || "sem bairro"}, ${input.citizen.cityId})`,
    `Trigger: ${input.trigger}`,
  ];
  if (input.payload.originalText)
    lines.push(`Pedido/queixa original: "${input.payload.originalText}"`);
  if (input.payload.action) lines.push(`Acao tomada: ${input.payload.action}`);
  if (input.payload.matches?.length) {
    lines.push("Matches relevantes:");
    for (const m of input.payload.matches) {
      lines.push(`- ${m.title}${m.cost ? ` (${m.cost})` : ""}`);
    }
  }
  if (input.payload.protocolNumber)
    lines.push(`Protocolo: ${input.payload.protocolNumber}`);
  if (input.payload.nextStep)
    lines.push(`Proximo passo sugerido: ${input.payload.nextStep}`);
  return lines.join("\n");
}

function fallback(input: ReplicaInput): string {
  const firstName = input.citizen.name.split(" ")[0];
  if (input.trigger === "talent_matched" && input.payload.matches?.length) {
    const m = input.payload.matches[0];
    return `Oi ${firstName}! Lembra que você comentou "${input.payload.originalText || "sobre seu sonho"}"? Achei um caminho bom: ${m.title}${m.cost ? ` (${m.cost})` : ""}. Posso te mandar como fazer o pré-cadastro?`;
  }
  if (input.trigger === "complaint_resolved") {
    return `Oi ${firstName}, passando aqui pra avisar: ${input.payload.action || "tomamos uma providência sobre o que você relatou"}. Qualquer coisa, me chama de novo, tá?`;
  }
  return `Oi ${firstName}! Recebi sua mensagem e já está sendo cuidada. Em breve te dou retorno por aqui.`;
}
