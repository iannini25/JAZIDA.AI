"use client";

// /dashboard/oportunidades — pagina dedicada com OpportunitiesPanel completo.
// Mesma vista do Q5 do overview, sem competir com outros quadrantes.

import { OpportunitiesPanel } from "@/components/dashboard/OpportunitiesPanel";

export default function OportunidadesPage() {
  return (
    <div className="flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          Just Transition · agente Semente
        </p>
        <h1 className="text-lg font-bold text-text-primary">
          Oportunidades econômicas detectadas
        </h1>
        <p className="mt-1 text-xs text-text-secondary">
          Cidadãos enviam ideias de negócio. JAZIDA cruza com demanda real da
          cidade, competição e programas de capital semente. Cada ideia
          financiada aqui é renda local recorrente — KPI direto pra ICMM PE9 /
          CSRD ESRS S3.
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-[1400px]">
          <OpportunitiesPanel />
        </div>
      </main>
    </div>
  );
}
