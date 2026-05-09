// Agent Semente — avalia ideia de negocio do cidadao em 4 dimensoes:
// estruturacao, mercado, veredito e plano de acao.
//
// Usa contexto da cidade pra cruzar:
//   - sinais de demanda (talents/queixas relacionadas)
//   - competicao (outras ideias na mesma categoria)
//   - perfil do cidadao
//
// Em DEMO_SAFE retorna HARDCODED_BEATRIZ (ou variantes) — garante demo nunca quebra.

import { db, emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_SEMENTE } from "@/lib/agents/prompts";
import type {
  ActionPlan,
  BusinessIdea,
  Citizen,
  Complaint,
  IdeaVerdict,
  IdeaVerdictLevel,
  MarketAnalysis,
  TalentEntry,
  BusinessIdeaStructured,
} from "@/types";

export type SementeInput = {
  rawInput: string;
  citizen: Citizen;
};

type RawSemente = {
  structured?: Partial<BusinessIdeaStructured>;
  marketAnalysis?: Partial<MarketAnalysis>;
  verdict?: Partial<IdeaVerdict>;
  actionPlan?: Partial<ActionPlan>;
};

export async function run(input: SementeInput): Promise<BusinessIdea> {
  const t0 = Date.now();
  const ctx = collectCityContext(input);

  let raw: RawSemente;
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    raw = pickHardcoded(input.rawInput);
    usedFallback = true;
  } else {
    try {
      const userMsg = buildUserMessage(input, ctx);
      raw = await callClaudeJson<RawSemente>({
        system: PROMPT_SEMENTE,
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 2200,
      });
    } catch (err) {
      console.warn("[semente] LLM falhou, fallback:", err);
      raw = pickHardcoded(input.rawInput);
      usedFallback = true;
    }
  }

  const idea: BusinessIdea = {
    id: newId(),
    citizenId: input.citizen.id,
    rawInput: input.rawInput,
    structured: sanitizeStructured(raw.structured),
    marketAnalysis: sanitizeMarket(raw.marketAnalysis),
    verdict: sanitizeVerdict(raw.verdict),
    actionPlan: sanitizePlan(raw.actionPlan),
    status: "analyzed",
    createdAt: nowIso(),
  };
  db.businessIdeas.push(idea);

  const ms = Date.now() - t0;
  logAgentCall("Semente", ms, usedFallback ? "fallback" : "ok", {
    citizenId: input.citizen.id,
    ideaId: idea.id,
    score: idea.verdict.score,
    level: idea.verdict.level,
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Semente",
    citizenId: input.citizen.id,
    action: `Avaliou "${idea.structured.title}" — veredito ${idea.verdict.level} (${idea.verdict.score}/100)`,
    payload: {
      ideaId: idea.id,
      score: idea.verdict.score,
      level: idea.verdict.level,
      fallback: usedFallback,
    },
    timestamp: nowIso(),
  });

  return idea;
}

// ──────────────────────────────────────────────────────────
// Contexto da cidade (sinais de demanda + competicao)
// ──────────────────────────────────────────────────────────
type CityContext = {
  relatedTalents: TalentEntry[];
  relatedComplaints: Complaint[];
  competitorIdeas: BusinessIdea[];
};

function collectCityContext(input: SementeInput): CityContext {
  const cityCitizens = new Set(
    db.citizens
      .filter((c) => c.cityId === input.citizen.cityId)
      .map((c) => c.id)
  );

  // Heuristica de keywords pra cruzar — cobre os casos da demo.
  const lower = input.rawInput.toLowerCase();
  const keywords = extractKeywords(lower);

  const matches = (text: string) =>
    keywords.some((k) => text.toLowerCase().includes(k));

  const relatedTalents = db.talents
    .filter((t) => cityCitizens.has(t.citizenId))
    .filter((t) => matches(t.rawInput) || matches(t.structured.label));

  const relatedComplaints = db.complaints
    .filter((c) => cityCitizens.has(c.citizenId))
    .filter((c) => matches(c.rawInput));

  const competitorIdeas = db.businessIdeas.filter((i) => {
    const sameCity = cityCitizens.has(i.citizenId);
    if (!sameCity) return false;
    return (
      matches(i.structured.title) ||
      matches(i.rawInput) ||
      matches(i.structured.category)
    );
  });

  return { relatedTalents, relatedComplaints, competitorIdeas };
}

function extractKeywords(text: string): string[] {
  const themes: Array<[RegExp, string[]]> = [
    [/cost(ur|ureir)|bordad|vestid|noiv/, ["costur", "vestid", "noiv", "alta-costura"]],
    [/padar|pao|confeitar/, ["padar", "pao", "confeit"]],
    [/cozinh|gastronom|chef|marmita/, ["cozinh", "gastronom", "marmita"]],
    [/enferm|saude|cuidad/, ["enferm", "saude", "cuidad"]],
    [/agricult|horta|plant/, ["agricult", "horta", "plant"]],
    [/tecnolog|program|software|app/, ["tecnolog", "program", "software"]],
    [/transport|frete|entreg/, ["transport", "frete", "entreg"]],
    [/manuten|conserto|reform/, ["manuten", "conserto", "reform"]],
    [/beleza|cabelo|estetic|salao/, ["beleza", "cabelo", "estetic", "salao"]],
  ];
  for (const [re, kws] of themes) {
    if (re.test(text)) return kws;
  }
  // generico: pega palavra >= 5 letras
  const word = text.match(/[a-zçãéáíóúâêô]{5,}/)?.[0];
  return word ? [word] : [];
}

function buildUserMessage(input: SementeInput, ctx: CityContext): string {
  const lines: string[] = [
    `IDEIA: ${input.rawInput}`,
    `PERFIL: ${input.citizen.name}, ${input.citizen.age ?? "?"} anos, ${input.citizen.occupation ?? "ocupacao desconhecida"}, mora em ${input.citizen.neighborhood ?? "?"}, cidade ${input.citizen.cityId}`,
    ``,
    `CONTEXTO DA CIDADE:`,
    `- Talentos/queixas relacionados na mesma categoria: ${ctx.relatedTalents.length + ctx.relatedComplaints.length} sinais`,
  ];
  if (ctx.relatedTalents.length > 0) {
    lines.push(`  Exemplos de talentos:`);
    for (const t of ctx.relatedTalents.slice(0, 8)) {
      lines.push(
        `    - ${t.structured.label} (${t.structured.category}) :: "${t.rawInput.slice(0, 80)}"`
      );
    }
  }
  if (ctx.relatedComplaints.length > 0) {
    lines.push(`  Exemplos de queixas:`);
    for (const c of ctx.relatedComplaints.slice(0, 5)) {
      lines.push(`    - "${c.rawInput.slice(0, 80)}"`);
    }
  }
  lines.push(
    `- Competidores na mesma categoria ja cadastrados: ${ctx.competitorIdeas.length}`
  );
  for (const i of ctx.competitorIdeas.slice(0, 5)) {
    lines.push(
      `    - ${i.structured.title} (score=${i.verdict.score}, level=${i.verdict.level})`
    );
  }
  lines.push(``, `Analise e retorne o JSON.`);
  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────
// Sanitize / defaults pra blindar contra LLM mal comportado
// ──────────────────────────────────────────────────────────
function sanitizeStructured(
  s: Partial<BusinessIdeaStructured> | undefined
): BusinessIdeaStructured {
  return {
    title: String(s?.title || "Ideia em analise").slice(0, 80),
    category: String(s?.category || "outro"),
    description: String(s?.description || ""),
    targetCustomer: String(s?.targetCustomer || ""),
    estimatedCapex: {
      min: Number(s?.estimatedCapex?.min ?? 0),
      max: Number(s?.estimatedCapex?.max ?? 0),
    },
    estimatedMonthlyRevenue: {
      min: Number(s?.estimatedMonthlyRevenue?.min ?? 0),
      max: Number(s?.estimatedMonthlyRevenue?.max ?? 0),
    },
    estimatedPaybackMonths: Math.max(
      0,
      Math.round(Number(s?.estimatedPaybackMonths ?? 12))
    ),
    suggestedLegalForm:
      s?.suggestedLegalForm === "ME" ||
      s?.suggestedLegalForm === "EI" ||
      s?.suggestedLegalForm === "EIRELI"
        ? s.suggestedLegalForm
        : "MEI",
  };
}

function sanitizeMarket(m: Partial<MarketAnalysis> | undefined): MarketAnalysis {
  return {
    demandSignal: {
      score: clamp(Number(m?.demandSignal?.score ?? 50), 0, 100),
      evidence: String(m?.demandSignal?.evidence || ""),
      relatedTalents: Math.max(
        0,
        Math.round(Number(m?.demandSignal?.relatedTalents ?? 0))
      ),
    },
    competitionLevel:
      m?.competitionLevel === "none" ||
      m?.competitionLevel === "low" ||
      m?.competitionLevel === "medium" ||
      m?.competitionLevel === "saturated"
        ? m.competitionLevel
        : "low",
    competitionEvidence: String(m?.competitionEvidence || ""),
    localContentMatch: m?.localContentMatch
      ? {
          potential: Boolean(m.localContentMatch.potential),
          description: String(m.localContentMatch.description || ""),
        }
      : undefined,
  };
}

function sanitizeVerdict(v: Partial<IdeaVerdict> | undefined): IdeaVerdict {
  const score = clamp(Math.round(Number(v?.score ?? 50)), 0, 100);
  let level: IdeaVerdictLevel =
    v?.level === "go" || v?.level === "adjust" || v?.level === "pivot"
      ? v.level
      : score >= 70
        ? "go"
        : score >= 40
          ? "adjust"
          : "pivot";
  return {
    score,
    level,
    headline: String(v?.headline || "").slice(0, 140),
    reasoning: String(v?.reasoning || ""),
  };
}

function sanitizePlan(p: Partial<ActionPlan> | undefined): ActionPlan {
  const steps = (p?.nextSteps || [])
    .filter((s) => s && typeof s.title === "string")
    .map((s, i) => ({
      order: Math.max(1, Number(s.order ?? i + 1)),
      title: String(s.title),
      description: String(s.description || ""),
      estimatedTime: String(s.estimatedTime || ""),
      link: s.link ? String(s.link) : undefined,
    }))
    .sort((a, b) => a.order - b.order);
  const fundings = (p?.fundingOpportunities || [])
    .filter((f) => f && typeof f.name === "string")
    .map((f) => ({
      name: String(f.name),
      type:
        f.type === "loan" || f.type === "training" || f.type === "grant"
          ? f.type
          : "training",
      amount: f.amount ? String(f.amount) : undefined,
      eligibility: String(f.eligibility || ""),
      contactInfo: f.contactInfo ? String(f.contactInfo) : undefined,
    }));
  return { nextSteps: steps, fundingOpportunities: fundings };
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

// ──────────────────────────────────────────────────────────
// Hardcoded fallbacks pra DEMO_SAFE
// ──────────────────────────────────────────────────────────
function pickHardcoded(rawInput: string): RawSemente {
  const lower = rawInput.toLowerCase();
  if (/cost(ur|ureir)|vestid|noiv|bordad/.test(lower)) return HARDCODED_BEATRIZ;
  if (/padar|pao/.test(lower)) return HARDCODED_PADARIA;
  if (/marmita|gastronom|cozinh/.test(lower)) return HARDCODED_MARMITA;
  return HARDCODED_GENERICO(rawInput);
}

const HARDCODED_BEATRIZ: RawSemente = {
  structured: {
    title: "Costureira de Vestido de Noiva — Mariana",
    category: "moda/costura",
    description:
      "Confeccao sob medida de vestidos de noiva e festa pra moradoras de Mariana e regiao. Atendimento domiciliar e atelie em casa.",
    targetCustomer:
      "Noivas e formandas de Mariana, Ouro Preto e Itabirito (raio 30km)",
    estimatedCapex: { min: 3500, max: 8000 },
    estimatedMonthlyRevenue: { min: 2800, max: 6500 },
    estimatedPaybackMonths: 4,
    suggestedLegalForm: "MEI",
  },
  marketAnalysis: {
    demandSignal: {
      score: 88,
      evidence:
        "47 cidadaos cadastraram 'vestido sob medida' ou 'costureira' como servico necessario nos ultimos 6 meses",
      relatedTalents: 47,
    },
    competitionLevel: "none",
    competitionEvidence:
      "Zero costureiras formais (MEI/ME) cadastradas em Mariana. 2 cadastros informais sem CNPJ.",
    localContentMatch: {
      potential: false,
      description:
        "Nao ha demanda direta da Vale pra esse servico, mas ha demanda indireta via colaboradores",
    },
  },
  verdict: {
    score: 87,
    level: "go",
    headline: "Mercado represado: 47 pedidos, zero oferta formal. Voce pode ser a primeira.",
    reasoning:
      "Demanda altissima e competicao inexistente em Mariana. CAPEX baixo (R$ 3,5–8k). Payback em 4 meses. Categoria perfeita pra MEI. Programa Vale Fundacao cobre quase todo o capital inicial.",
  },
  actionPlan: {
    nextSteps: [
      {
        order: 1,
        title: "Abra MEI online",
        description: "Formalizacao gratuita em 15 minutos no portal gov.br",
        estimatedTime: "15 min",
        link: "https://gov.br/mei",
      },
      {
        order: 2,
        title: "Capital Semente Vale Fundacao",
        description:
          "Programa 'Empreender Mariana' financia ate R$ 5.000 pra MEIs novos",
        estimatedTime: "2 dias pra cadastro",
        link: "https://fundacaovale.org/",
      },
      {
        order: 3,
        title: "Curso Sebrae 'Costura como Negocio'",
        description: "30 horas, online, gratuito",
        estimatedTime: "1 mes",
        link: "https://sebrae.com.br",
      },
      {
        order: 4,
        title: "Cadastre-se no JAZIDA Marketplace",
        description: "Os 47 cidadaos que pediram costureira vao te ver primeiro",
        estimatedTime: "5 min",
      },
      {
        order: 5,
        title: "Banco do Povo MG — Linha Empreendedora",
        description:
          "Microcredito ate R$ 21.000 com taxas reduzidas pra mulheres",
        estimatedTime: "1 semana",
        link: "https://bdpmg.com.br",
      },
    ],
    fundingOpportunities: [
      {
        name: "Vale Fundacao · Empreender Mariana",
        type: "grant",
        amount: "ate R$ 5.000",
        eligibility:
          "MEI recem-aberto, residente em Mariana ha 2+ anos",
      },
      {
        name: "Banco do Povo MG · Empreendedora",
        type: "loan",
        amount: "ate R$ 21.000",
        eligibility: "MEI ativo, residente MG, mulher",
      },
      {
        name: "Sebrae · Costura como Negocio",
        type: "training",
        eligibility: "Aberto a todos",
      },
    ],
  },
};

const HARDCODED_PADARIA: RawSemente = {
  structured: {
    title: "Padaria de Bairro — Mariana",
    category: "comercio/alimentacao",
    description:
      "Padaria de bairro com producao propria de paes artesanais e salgados pra moradores locais.",
    targetCustomer: "Moradores do bairro num raio de 1km",
    estimatedCapex: { min: 25000, max: 60000 },
    estimatedMonthlyRevenue: { min: 8000, max: 18000 },
    estimatedPaybackMonths: 14,
    suggestedLegalForm: "MEI",
  },
  marketAnalysis: {
    demandSignal: {
      score: 55,
      evidence:
        "12 cidadaos mencionaram 'padaria' nos ultimos 6 meses, demanda moderada e regular",
      relatedTalents: 12,
    },
    competitionLevel: "saturated",
    competitionEvidence:
      "6 padarias ja operam em Mariana centro/Cabanas. Mercado disputado.",
    localContentMatch: { potential: false, description: "" },
  },
  verdict: {
    score: 38,
    level: "pivot",
    headline: "Mercado saturado, mas tem nicho aberto: confeitaria de festa.",
    reasoning:
      "Padaria comum tem 6 competidores em Mariana — competicao alta e margens apertadas. Mas zero confeitaria especializada em bolo de casamento/festa. Vire essa esquina e a ideia ressurge como GO.",
  },
  actionPlan: {
    nextSteps: [
      {
        order: 1,
        title: "Pivote: especialize em festas/casamentos",
        description: "Bolo cenografico, doces de festa — nicho sem competicao em Mariana",
        estimatedTime: "1 semana de pesquisa",
      },
      {
        order: 2,
        title: "Curso Sebrae 'Confeitaria como Negocio'",
        description: "Especializacao em confeitaria de festa",
        estimatedTime: "2 meses",
        link: "https://sebrae.com.br",
      },
      {
        order: 3,
        title: "Abra MEI ou ME (avalie volume)",
        description: "MEI ate R$ 81k/ano. Confeitaria de casamento pode passar disso.",
        estimatedTime: "30 min",
        link: "https://gov.br/mei",
      },
      {
        order: 4,
        title: "Vigilancia sanitaria local",
        description:
          "Producao de alimento exige alvara — Vigilancia Sanitaria de Mariana",
        estimatedTime: "30 dias",
      },
    ],
    fundingOpportunities: [
      {
        name: "Banco do Povo MG",
        type: "loan",
        amount: "ate R$ 21.000",
        eligibility: "MEI ativo",
      },
      {
        name: "Sebrae · Confeitaria",
        type: "training",
        eligibility: "Aberto",
      },
    ],
  },
};

const HARDCODED_MARMITA: RawSemente = {
  structured: {
    title: "Marmitaria pra Trabalhador da Mineradora",
    category: "comercio/alimentacao",
    description:
      "Producao de marmitas balanceadas pra trabalhadores em turno na Vale.",
    targetCustomer: "Trabalhadores da mineradora em turnos diurno e noturno",
    estimatedCapex: { min: 8000, max: 18000 },
    estimatedMonthlyRevenue: { min: 5000, max: 14000 },
    estimatedPaybackMonths: 6,
    suggestedLegalForm: "MEI",
  },
  marketAnalysis: {
    demandSignal: {
      score: 78,
      evidence:
        "Categoria com demanda regular: 18 cidadaos mencionaram alimentacao em turno",
      relatedTalents: 18,
    },
    competitionLevel: "low",
    competitionEvidence: "1-2 fornecedores informais existentes, sem contrato direto.",
    localContentMatch: {
      potential: true,
      description:
        "Vale procura fornecedores certificados de marmita pra refeitorios e turnos remotos. Local content match alto.",
    },
  },
  verdict: {
    score: 76,
    level: "go",
    headline: "Local content match: Vale procura fornecedora certificada.",
    reasoning:
      "Demanda forte da propria mineradora + competicao baixa. Programa de fornecedores Vale paga adiantado. CAPEX moderado.",
  },
  actionPlan: {
    nextSteps: [
      {
        order: 1,
        title: "Abra MEI",
        description: "Formalizacao gratuita",
        estimatedTime: "15 min",
        link: "https://gov.br/mei",
      },
      {
        order: 2,
        title: "Programa Fornecedor Local Vale",
        description: "Cadastro como fornecedor de alimentacao pra refeitorios",
        estimatedTime: "2 semanas",
      },
      {
        order: 3,
        title: "Vigilancia sanitaria + cozinha industrial",
        description: "Adequacao da cozinha pra padrao mineradora",
        estimatedTime: "1 mes",
      },
      {
        order: 4,
        title: "Curso Sebrae 'Alimentacao Coletiva'",
        description: "Especializacao em producao em escala",
        estimatedTime: "2 meses",
        link: "https://sebrae.com.br",
      },
    ],
    fundingOpportunities: [
      {
        name: "Vale Fundacao · Empreender Mariana",
        type: "grant",
        amount: "ate R$ 5.000",
        eligibility: "MEI recem-aberto",
      },
      {
        name: "Banco do Povo MG",
        type: "loan",
        amount: "ate R$ 21.000",
        eligibility: "MEI ativo",
      },
    ],
  },
};

function HARDCODED_GENERICO(rawInput: string): RawSemente {
  const title = rawInput.slice(0, 60).trim() || "Ideia em analise";
  return {
    structured: {
      title,
      category: "outro",
      description: rawInput.slice(0, 200),
      targetCustomer: "Moradores da cidade",
      estimatedCapex: { min: 5000, max: 15000 },
      estimatedMonthlyRevenue: { min: 3000, max: 8000 },
      estimatedPaybackMonths: 8,
      suggestedLegalForm: "MEI",
    },
    marketAnalysis: {
      demandSignal: {
        score: 50,
        evidence: "Sinais moderados detectados na cidade",
        relatedTalents: 5,
      },
      competitionLevel: "low",
      competitionEvidence: "Poucos cadastros similares na cidade.",
    },
    verdict: {
      score: 60,
      level: "adjust",
      headline: "Ideia viavel, vale ajustar antes de comecar.",
      reasoning:
        "Mercado existe mas nao temos sinais fortes de demanda represada. Recomendado validar com 5-10 clientes antes de investir.",
    },
    actionPlan: {
      nextSteps: [
        {
          order: 1,
          title: "Abra MEI online",
          description: "Formalizacao em 15 min no gov.br",
          estimatedTime: "15 min",
          link: "https://gov.br/mei",
        },
        {
          order: 2,
          title: "Curso Sebrae de empreendedorismo",
          description: "Capacitacao gratuita em 30h",
          estimatedTime: "1 mes",
          link: "https://sebrae.com.br",
        },
        {
          order: 3,
          title: "Validacao com 10 clientes-piloto",
          description: "Teste a ideia antes de comprar equipamento",
          estimatedTime: "2 semanas",
        },
        {
          order: 4,
          title: "Cadastre-se no JAZIDA Marketplace",
          description: "Apareca pra clientes que ja pediram esse servico",
          estimatedTime: "5 min",
        },
      ],
      fundingOpportunities: [
        {
          name: "Sebrae · Empreendedorismo",
          type: "training",
          eligibility: "Aberto a todos",
        },
        {
          name: "Banco do Povo MG",
          type: "loan",
          amount: "ate R$ 21.000",
          eligibility: "MEI ativo, residente MG",
        },
      ],
    },
  };
}
