// Agent Bussola — cruza talento estruturado com oportunidades reais.
//
// LLM output (prompt 01): { matches: [{ type, title, description, duration?, cost?, fitScore }] }
// Tipo BussolaMatch do master tem `link?` extra, NAO tem `id` (se vier id, ignora).

import { emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_BUSSOLA } from "@/lib/agents/prompts";
import type { BussolaMatch, Citizen, TalentEntry } from "@/types";

export type BussolaInput = {
  talent: TalentEntry;
  citizen: Citizen;
};

export type BussolaOutput = {
  matches: BussolaMatch[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawMatch = any;
type RawBussola = { matches?: RawMatch[] };

export async function run(input: BussolaInput): Promise<BussolaOutput> {
  const t0 = Date.now();

  const userMsg = `Talento estruturado:
- label: ${input.talent.structured.label}
- category: ${input.talent.structured.category}
- type: ${input.talent.type}

Cidadao:
- cidade: ${input.citizen.cityId}
- idade: ${input.citizen.age ?? "desconhecida"}
- bairro: ${input.citizen.neighborhood ?? "desconhecido"}
- ocupacao atual: ${input.citizen.occupation ?? "desconhecida"}

Gere 3 matches em ordem de relevancia.`;

  let raw: RawBussola;
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    raw = { matches: fallbackMatches(input) };
    usedFallback = true;
  } else {
    try {
      raw = await callClaudeJson<RawBussola>({
        system: PROMPT_BUSSOLA,
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 1200,
      });
    } catch (err) {
      console.warn("[bussola] LLM falhou, fallback:", err);
      raw = { matches: fallbackMatches(input) };
      usedFallback = true;
    }
  }

  const matches: BussolaMatch[] = (raw.matches || [])
    .map(normalizeMatch)
    .filter(Boolean) as BussolaMatch[];

  const ms = Date.now() - t0;
  logAgentCall("Bussola", ms, usedFallback ? "fallback" : "ok", {
    count: matches.length,
    talentLabel: input.talent.structured.label,
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Bussola",
    citizenId: input.citizen.id,
    action: `${matches.length} matches para "${input.talent.structured.label}"`,
    payload: {
      talentId: input.talent.id,
      titles: matches.map((m) => m.title),
      fallback: usedFallback,
    },
    timestamp: nowIso(),
  });

  return { matches };
}

function normalizeMatch(m: RawMatch): BussolaMatch | null {
  if (!m || typeof m !== "object") return null;
  const type =
    m.type === "course" || m.type === "job" || m.type === "entrepreneurship"
      ? m.type
      : "course";
  if (!m.title) return null;
  const fitScore =
    typeof m.fitScore === "number"
      ? Math.max(0, Math.min(1, m.fitScore))
      : 0.5;
  return {
    type,
    title: String(m.title),
    description: String(m.description || ""),
    duration: m.duration ? String(m.duration) : undefined,
    cost: m.cost ? String(m.cost) : undefined,
    link: m.link ? String(m.link) : undefined,
    fitScore,
  };
}

// ──────────────────────────────────────────────────────────
// Fallback DEMO_SAFE — banco de matches por categoria, com viés Mariana.
// ──────────────────────────────────────────────────────────
function fallbackMatches(input: BussolaInput): BussolaMatch[] {
  const cat = input.talent.structured.category.toLowerCase();
  const isMariana = input.citizen.cityId === "mariana";

  if (cat.startsWith("saude")) {
    return [
      {
        type: "course",
        title: isMariana
          ? "Curso Tecnico em Enfermagem - SENAI Mariana"
          : "Curso Tecnico em Enfermagem - SENAI",
        description:
          "24 meses, com bolsa via Vale Fundacao. Estagio supervisionado em hospital local.",
        duration: "24 meses",
        cost: "Bolsa Vale Fundacao - R$ 0",
        fitScore: 0.95,
      },
      {
        type: "job",
        title: isMariana
          ? "Auxiliar de Enfermagem - Hospital Monsenhor Horta"
          : "Auxiliar de Enfermagem - Hospital local",
        description: "Vagas CLT, plantao 12x36.",
        cost: "Salario inicial R$ 1.850 + beneficios",
        fitScore: 0.78,
      },
      {
        type: "entrepreneurship",
        title: "Sebrae Saude Domiciliar",
        description:
          "Programa de microempreendedorismo em cuidados domiciliares.",
        duration: "6 meses",
        cost: "Gratuito",
        fitScore: 0.62,
      },
    ];
  }

  if (cat.includes("arte") || cat.includes("cultura")) {
    return [
      {
        type: "entrepreneurship",
        title: "Formalizacao MEI + vitrine no Mercado de Artesanato",
        description:
          "Sebrae faz mentoria gratuita e ajuda a entrar nos pontos de venda da cidade.",
        cost: "Gratuito",
        fitScore: 0.91,
      },
      {
        type: "course",
        title: "Senac - Empreendedorismo Criativo",
        description: "Curso de 4 meses com modulo de precificacao.",
        duration: "4 meses",
        cost: "R$ 120/mes (financiavel)",
        fitScore: 0.7,
      },
      {
        type: "job",
        title: "Feira local — vendedor parceiro",
        description: "Pontos de venda rotativos toda semana.",
        cost: "Comissao 70/30",
        fitScore: 0.55,
      },
    ];
  }

  if (cat.includes("tecn") || cat.includes("tecnologia")) {
    return [
      {
        type: "course",
        title: isMariana
          ? "Logica de Programacao - SENAI Mariana"
          : "Logica de Programacao - SENAI",
        description: "Curso introdutorio de 3 meses.",
        duration: "3 meses",
        cost: "Gratuito (bolsa Pronatec)",
        fitScore: 0.9,
      },
      {
        type: "course",
        title: "Recode - Bootcamp Web",
        description: "ONG com formacao online em desenvolvimento web.",
        duration: "5 meses",
        cost: "Gratuito",
        fitScore: 0.78,
      },
      {
        type: "entrepreneurship",
        title: "Sebrae - MEI Tech",
        description: "Mentoria pra prestadores de servico autonomos de TI.",
        cost: "Gratuito",
        fitScore: 0.5,
      },
    ];
  }

  // generico
  return [
    {
      type: "course",
      title: "Senac - Curso introdutorio na area",
      description: "Programa modular sob demanda.",
      duration: "2-6 meses",
      cost: "Bolsa parcial Pronatec disponivel",
      fitScore: 0.7,
    },
    {
      type: "job",
      title: "Vagas no comercio local",
      description: "Sine Mariana publica vagas semanais.",
      fitScore: 0.55,
    },
    {
      type: "entrepreneurship",
      title: "MEI - formalizacao e mentoria Sebrae",
      description: "Para quem quer empreender por conta propria.",
      cost: "Gratuito",
      fitScore: 0.5,
    },
  ];
}
