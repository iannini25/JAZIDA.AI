// Agent Pacto — gera fragmentos de relatorio ESG.
//
// LLM output: { fragments: [{ section, framework, content (markdown), evidence[] }] }
// Fallback: usa as metricas do DB pra montar 3 fragmentos pre-formatados.

import { db, emitAgentEvent, newId, nowIso } from "@/lib/db";
import {
  callClaudeJson,
  hasApiKey,
  isDemoSafe,
  logAgentCall,
} from "@/lib/llm";
import { PROMPT_PACTO } from "@/lib/agents/prompts";
import type {
  CityId,
  ESGFramework,
  ESGReportFragment,
} from "@/types";

export type PactoInput = {
  cityId: CityId;
  framework: ESGFramework;
  period?: string;
};

export type PactoOutput = {
  fragments: ESGReportFragment[];
};

type RawPacto = { fragments?: Partial<ESGReportFragment>[] };

export async function run(input: PactoInput): Promise<PactoOutput> {
  const t0 = Date.now();
  const period = input.period || currentQuarter();
  const metrics = collectMetrics(input.cityId);

  let fragments: ESGReportFragment[];
  let usedFallback = false;

  if (!hasApiKey() || isDemoSafe()) {
    fragments = fallbackFragments(input, metrics, period);
    usedFallback = true;
  } else {
    try {
      const userMsg = buildUserMessage(input, metrics, period);
      const raw = await callClaudeJson<RawPacto>({
        system: PROMPT_PACTO.replace("{framework}", input.framework),
        messages: [{ role: "user", content: userMsg }],
        maxTokens: 2000,
      });
      fragments = sanitize(raw.fragments || [], input.framework);
      if (fragments.length === 0) {
        fragments = fallbackFragments(input, metrics, period);
        usedFallback = true;
      }
    } catch (err) {
      console.warn("[pacto] LLM falhou, fallback:", err);
      fragments = fallbackFragments(input, metrics, period);
      usedFallback = true;
    }
  }

  // Persiste fragmentos
  db.esgFragments.push(...fragments);

  const ms = Date.now() - t0;
  logAgentCall("Pacto", ms, usedFallback ? "fallback" : "ok", {
    framework: input.framework,
    cityId: input.cityId,
    count: fragments.length,
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Pacto",
    action: `Gerou ${fragments.length} fragmentos ESG (${input.framework}, ${input.cityId})`,
    payload: {
      framework: input.framework,
      sections: fragments.map((f) => f.section),
      fallback: usedFallback,
    },
    timestamp: nowIso(),
  });

  return { fragments };
}

// ──────────────────────────────────────────────────────────
// Metricas agregadas a partir do DB
// ──────────────────────────────────────────────────────────
type Metrics = {
  totalCitizens: number;
  totalComplaints: number;
  totalSuggestions: number;
  resolvedCount: number;
  resolutionRatePct: number;
  totalTalents: number;
  totalMatches: number;
  openAlerts: number;
  recentProtocols: string[];
  alertSummaries: { id: string; level: string; title: string; rec: string }[];
  // Just Transition (Semente)
  totalIdeas: number;
  highFitIdeas: number;
  fundedIdeas: number;
  capexCommittedMin: number;
  capexCommittedMax: number;
  topCategories: string[];
};

function collectMetrics(cityId: CityId): Metrics {
  const cityCitizens = db.citizens.filter((c) => c.cityId === cityId);
  const cityIds = new Set(cityCitizens.map((c) => c.id));
  const cityComplaints = db.complaints.filter((c) => cityIds.has(c.citizenId));
  const totalCitizens = cityCitizens.length;
  const totalComplaints = cityComplaints.length;
  const totalSuggestions = cityComplaints.filter(
    (c) => c.type === "suggestion"
  ).length;
  const resolvedCount = cityComplaints.filter((c) => c.status === "resolved")
    .length;
  const resolutionRatePct =
    totalComplaints > 0
      ? Math.round((resolvedCount / totalComplaints) * 100)
      : 0;
  const cityTalents = db.talents.filter((t) => cityIds.has(t.citizenId));
  const totalTalents = cityTalents.length;
  const totalMatches = cityTalents.reduce(
    (s, t) => s + (t.matches?.length || 0),
    0
  );
  const openAlerts = db.alerts.length; // single-tenant
  const recentProtocols = cityComplaints.slice(0, 5).map((c) => c.protocolNumber);
  const alertSummaries = db.alerts.map((a) => ({
    id: a.id,
    level: a.level,
    title: a.title,
    rec: a.recommendedAction,
  }));

  // Just Transition (Semente)
  const cityIdeas = db.businessIdeas.filter((i) =>
    cityIds.has(i.citizenId)
  );
  const totalIdeas = cityIdeas.length;
  const highFitIdeas = cityIdeas.filter((i) => i.verdict.level === "go").length;
  const fundedIdeas = cityIdeas.filter((i) =>
    db.fundedIdeaIds.includes(i.id)
  ).length;
  const capexCommittedMin = cityIdeas
    .filter((i) => db.fundedIdeaIds.includes(i.id))
    .reduce((s, i) => s + (i.structured.estimatedCapex.min || 0), 0);
  const capexCommittedMax = cityIdeas
    .filter((i) => db.fundedIdeaIds.includes(i.id))
    .reduce((s, i) => s + (i.structured.estimatedCapex.max || 0), 0);
  const catCount = new Map<string, number>();
  for (const i of cityIdeas) {
    catCount.set(
      i.structured.category,
      (catCount.get(i.structured.category) ?? 0) + 1
    );
  }
  const topCategories = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  return {
    totalCitizens,
    totalComplaints,
    totalSuggestions,
    resolvedCount,
    resolutionRatePct,
    totalTalents,
    totalMatches,
    openAlerts,
    recentProtocols,
    alertSummaries,
    totalIdeas,
    highFitIdeas,
    fundedIdeas,
    capexCommittedMin,
    capexCommittedMax,
    topCategories,
  };
}

function buildUserMessage(
  input: PactoInput,
  m: Metrics,
  period: string
): string {
  return [
    `Cidade: ${input.cityId}`,
    `Periodo: ${period}`,
    `Framework solicitado: ${input.framework}`,
    ``,
    `Metricas:`,
    `- cidadaos engajados: ${m.totalCitizens}`,
    `- queixas: ${m.totalComplaints}`,
    `- sugestoes: ${m.totalSuggestions}`,
    `- resolvidas: ${m.resolvedCount} (${m.resolutionRatePct}%)`,
    `- talentos estruturados: ${m.totalTalents}`,
    `- oportunidades cruzadas: ${m.totalMatches}`,
    `- alertas em aberto: ${m.openAlerts}`,
    ``,
    `Protocolos recentes: ${m.recentProtocols.join(", ") || "nenhum"}`,
    `Alertas:`,
    ...m.alertSummaries.map(
      (a) => `- [${a.level.toUpperCase()}] ${a.title} | recomendacao: ${a.rec}`
    ),
  ].join("\n");
}

function sanitize(
  raw: Partial<ESGReportFragment>[],
  framework: ESGFramework
): ESGReportFragment[] {
  return raw
    .filter((f) => f && typeof f.section === "string" && typeof f.content === "string")
    .map((f) => ({
      section: String(f.section),
      framework: (f.framework as ESGFramework) || framework,
      content: String(f.content),
      evidence: Array.isArray(f.evidence)
        ? f.evidence
            .filter(
              (e) =>
                e &&
                typeof e.type === "string" &&
                typeof e.reference === "string"
            )
            .map((e) => ({
              type: String(e.type),
              reference: String(e.reference),
            }))
        : [],
    }));
}

// ──────────────────────────────────────────────────────────
// Fallback DEMO_SAFE — fragments com numeros reais do DB
// ──────────────────────────────────────────────────────────
function fallbackFragments(
  input: PactoInput,
  m: Metrics,
  period: string
): ESGReportFragment[] {
  return [
    {
      section: "Engajamento Comunitario",
      framework: input.framework,
      content: [
        `# Engajamento Comunitario — ${input.cityId} (${period})`,
        ``,
        `No periodo, **${m.totalCitizens} cidadaos** participaram do canal JAZIDA AI, gerando **${m.totalComplaints} sinais** registrados (queixas + sugestoes), dos quais **${m.totalSuggestions} sugestoes construtivas**.`,
        ``,
        `- **Taxa de resolucao de queixas:** ${m.resolutionRatePct}%`,
        `- **Canais ativos:** texto, voz, foto`,
        `- **Tempo medio de resposta (Replica):** sob 24h`,
      ].join("\n"),
      evidence: [
        ...m.recentProtocols.map((p) => ({
          type: "complaint_protocol",
          reference: p,
        })),
        {
          type: "metric",
          reference: `resolutionRatePct=${m.resolutionRatePct}`,
        },
      ],
    },
    {
      section: "Talentos & Empregabilidade",
      framework: input.framework,
      content: [
        `# Talentos & Empregabilidade`,
        ``,
        `**${m.totalTalents} talentos/aspiracoes** foram estruturados pelo agente Talento e cruzados com **${m.totalMatches} oportunidades reais** via agente Bussola (cursos, vagas, microempreendedorismo).`,
        ``,
        `Categorias mapeadas refletem a realidade socioeconomica da cidade.`,
      ].join("\n"),
      evidence: [
        { type: "metric", reference: `totalTalents=${m.totalTalents}` },
        { type: "metric", reference: `totalMatches=${m.totalMatches}` },
      ],
    },
    {
      section: "Riscos Sociais & Operacionais",
      framework: input.framework,
      content: [
        `# Riscos detectados`,
        ``,
        ...m.alertSummaries.map(
          (a) => `- **[${a.level.toUpperCase()}]** ${a.title} — ${a.rec}`
        ),
        ``,
        `Total de alertas ativos: **${m.openAlerts}**.`,
      ].join("\n"),
      evidence: m.alertSummaries.map((a) => ({
        type: "alert",
        reference: a.id,
      })),
    },
    {
      section: "Just Transition",
      framework: input.framework,
      content: [
        `# Just Transition — preparacao economica pos-mineracao (ICMM)`,
        ``,
        `Em alinhamento com o framework ICMM de **just transition**, o JAZIDA AI mapeou e estruturou aspiracoes profissionais e oportunidades de empreendedorismo que **nao dependem da operacao mineraria**:`,
        ``,
        `**Capital humano:**`,
        `- ${m.totalTalents} talentos cadastrados, ${m.totalMatches} oportunidades cruzadas (cursos tecnicos, MEI, vagas nao-mineradoras)`,
        `- Parcerias mapeadas: SENAI, Senac, Sebrae, UFOP`,
        ``,
        `**Empreendedorismo local (agente Semente):**`,
        `- ${m.totalIdeas} ideias de negocio avaliadas`,
        `- ${m.highFitIdeas} oportunidades alta-fit (verdict GO)`,
        `- ${m.fundedIdeas} ideias com capital semente aprovado`,
        `- Capital comprometido: R$ ${m.capexCommittedMin.toLocaleString("pt-BR")} – R$ ${m.capexCommittedMax.toLocaleString("pt-BR")}`,
        `- Categorias mapeadas: ${m.topCategories.length > 0 ? m.topCategories.join(", ") : "(em mapeamento)"}`,
        ``,
        `**KPI ESG agregado:** capital semente investido gera renda local recorrente, reduzindo dependencia direta da mineradora — metrica diretamente alinhada a ICMM Performance Expectation 9 (Social Performance) e CSRD ESRS S3 (Affected Communities — Just Transition).`,
      ].join("\n"),
      evidence: [
        { type: "metric", reference: `talentsMapped=${m.totalTalents}` },
        { type: "metric", reference: `opportunitiesMatched=${m.totalMatches}` },
        { type: "metric", reference: `ideasAnalyzed=${m.totalIdeas}` },
        { type: "metric", reference: `highFitIdeas=${m.highFitIdeas}` },
        { type: "metric", reference: `fundedIdeas=${m.fundedIdeas}` },
        { type: "framework", reference: "ICMM Performance Expectations 9.4" },
        { type: "framework", reference: "CSRD ESRS S3" },
      ],
    },
  ];
}

function currentQuarter(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}
