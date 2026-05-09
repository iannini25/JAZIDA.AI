// POST /api/dashboard/esg-report — gera draft de relatorio ESG
//
// Body: { framework?: "CSRD"|"CVM59"|"GRI"|"ICMM", cityId? }
// Fase 1 (mock): retorna fragmentos calculados a partir do DB.
// Fase 2: agente Pacto gera com base no estado real + LLM.

import { db, emitAgentEvent, newId, nowIso, saveDb } from "@/lib/db";
import { badRequest, ok, safeJson } from "@/lib/http";
import type {
  CityId,
  ESGFramework,
  ESGReportFragment,
} from "@/types";

export const dynamic = "force-dynamic";

const FRAMEWORKS: ESGFramework[] = ["CSRD", "CVM59", "GRI", "ICMM"];

type Body = {
  framework?: ESGFramework;
  cityId?: CityId;
};

export async function POST(req: Request) {
  const body = await safeJson<Body>(req);
  const framework: ESGFramework =
    body?.framework && FRAMEWORKS.includes(body.framework)
      ? body.framework
      : "CSRD";
  const cityId: CityId = body?.cityId || "mariana";

  if (!FRAMEWORKS.includes(framework)) {
    return badRequest(
      `framework invalido. esperado: ${FRAMEWORKS.join(", ")}`
    );
  }

  const fragments = buildFragments(framework, cityId);
  db.esgFragments.push(...fragments);
  saveDb();

  emitAgentEvent({
    id: newId(),
    agentName: "Pacto",
    action: `Gerou ${fragments.length} fragmentos ESG (${framework})`,
    payload: { framework, cityId, count: fragments.length },
    timestamp: nowIso(),
  });

  return ok({
    framework,
    cityId,
    fragments,
    generatedAt: nowIso(),
  });
}

function buildFragments(
  framework: ESGFramework,
  cityId: CityId
): ESGReportFragment[] {
  const totalCitizens = db.citizens.length;
  const totalComplaints = db.complaints.length;
  const totalSuggestions = db.complaints.filter(
    (c) => c.type === "suggestion"
  ).length;
  const resolved = db.complaints.filter((c) => c.status === "resolved")
    .length;
  const resolutionRate =
    totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;
  const totalTalents = db.talents.length;
  const totalMatches = db.talents.reduce(
    (s, t) => s + (t.matches?.length || 0),
    0
  );
  const openAlerts = db.alerts.length;

  const recentComplaintIds = db.complaints
    .slice(0, 3)
    .map((c) => c.protocolNumber);

  return [
    {
      framework,
      section: "Engajamento Comunitario",
      content: [
        `# Engajamento Comunitario — ${cityId} (${currentQuarter()})`,
        ``,
        `Durante o periodo, **${totalCitizens} cidadaos** participaram do canal JAZIDA AI, gerando **${totalComplaints} sinais** registrados (queixas + sugestoes), dos quais **${totalSuggestions} sugestoes construtivas**.`,
        ``,
        `- **Taxa de resolucao de queixas:** ${resolutionRate}%`,
        `- **Canais de captura:** texto, voz, foto`,
        `- **Tempo medio de resposta (Replica):** sob 24h`,
      ].join("\n"),
      evidence: [
        ...recentComplaintIds.map((p) => ({
          type: "complaint_protocol",
          reference: p,
        })),
        { type: "metric", reference: `resolutionRatePct=${resolutionRate}` },
      ],
    },
    {
      framework,
      section: "Talentos & Empregabilidade",
      content: [
        `# Talentos & Empregabilidade`,
        ``,
        `**${totalTalents} talentos/aspiracoes** foram estruturados pelo agente Talento e cruzados com **${totalMatches} oportunidades reais** via agente Bussola (cursos, vagas, microempreendedorismo).`,
        ``,
        `Principais categorias mapeadas: saude, arte/cultura, tecnico, comercio.`,
      ].join("\n"),
      evidence: [
        { type: "metric", reference: `totalTalents=${totalTalents}` },
        { type: "metric", reference: `totalMatches=${totalMatches}` },
      ],
    },
    {
      framework,
      section: "Riscos Sociais & Operacionais",
      content: [
        `# Riscos detectados`,
        ``,
        ...db.alerts.map(
          (a) =>
            `- **[${a.level.toUpperCase()}]** ${a.title} — ${a.recommendedAction}`
        ),
        ``,
        `Total de alertas ativos: **${openAlerts}**.`,
      ].join("\n"),
      evidence: db.alerts.map((a) => ({
        type: "alert",
        reference: a.id,
      })),
    },
  ];
}

function currentQuarter(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}
