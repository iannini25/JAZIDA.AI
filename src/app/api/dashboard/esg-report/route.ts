// POST /api/dashboard/esg-report — gera draft de relatorio ESG via agent Pacto
import { badRequest, ok, safeJson, serverError } from "@/lib/http";
import { generateEsg } from "@/lib/orchestrator";
import { nowIso } from "@/lib/db";
import type { CityId, ESGFramework } from "@/types";

export const dynamic = "force-dynamic";

const FRAMEWORKS: ESGFramework[] = ["CSRD", "CVM59", "GRI", "ICMM"];
const VALID_CITIES: CityId[] = ["mariana", "itabira", "paracatu", "araxa"];

type Body = {
  framework?: ESGFramework;
  cityId?: CityId;
  period?: string;
};

export async function POST(req: Request) {
  const body = await safeJson<Body>(req);
  const framework: ESGFramework =
    body?.framework && FRAMEWORKS.includes(body.framework)
      ? body.framework
      : "CSRD";
  const cityId: CityId =
    body?.cityId && VALID_CITIES.includes(body.cityId)
      ? body.cityId
      : "mariana";

  if (!FRAMEWORKS.includes(framework)) {
    return badRequest(
      `framework invalido. esperado: ${FRAMEWORKS.join(", ")}`
    );
  }

  try {
    const fragments = await generateEsg({
      cityId,
      framework,
      period: body?.period,
    });
    return ok({
      framework,
      cityId,
      period: body?.period || currentQuarter(),
      fragments,
      generatedAt: nowIso(),
    });
  } catch (err) {
    return serverError("falha ao gerar relatorio ESG", err);
  }
}

function currentQuarter(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}
