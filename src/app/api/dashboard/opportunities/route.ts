// GET /api/dashboard/opportunities — agregado de oportunidades por categoria.
//
// Agrupa businessIdeas por categoria, conta high-fit (verdict.level==="go"),
// soma capex sugerido. Retorna top 3 ideias por categoria.

import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import type { BusinessIdea, OpportunityAggregate } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const buckets = new Map<string, BusinessIdea[]>();
  for (const idea of db.businessIdeas) {
    const list = buckets.get(idea.structured.category) ?? [];
    list.push(idea);
    buckets.set(idea.structured.category, list);
  }

  const aggregates: OpportunityAggregate[] = [...buckets.entries()].map(
    ([category, ideas]) => {
      const highFit = ideas.filter((i) => i.verdict.level === "go");
      const capexMin = ideas.reduce(
        (s, i) => s + (i.structured.estimatedCapex.min || 0),
        0
      );
      const capexMax = ideas.reduce(
        (s, i) => s + (i.structured.estimatedCapex.max || 0),
        0
      );
      const topIdeas = [...ideas]
        .sort((a, b) => b.verdict.score - a.verdict.score)
        .slice(0, 3);
      return {
        category,
        pendingIdeasCount: ideas.length,
        highFitCount: highFit.length,
        totalCapexNeeded: { min: capexMin, max: capexMax },
        topIdeas,
      };
    }
  );

  // Ordena: high-fit primeiro, depois por contagem
  aggregates.sort((a, b) => {
    if (b.highFitCount !== a.highFitCount)
      return b.highFitCount - a.highFitCount;
    return b.pendingIdeasCount - a.pendingIdeasCount;
  });

  // Totais agregados (KPI ESG)
  const totals = {
    ideasAnalyzed: db.businessIdeas.length,
    highFitTotal: db.businessIdeas.filter((i) => i.verdict.level === "go")
      .length,
    capexSuggested: aggregates.reduce(
      (s, a) => s + a.totalCapexNeeded.max,
      0
    ),
    fundedCount: db.fundedIdeaIds.length,
  };

  return ok({ aggregates, totals });
}
