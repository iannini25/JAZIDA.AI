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
          Oportunidades economicas detectadas
        </h1>
        <p className="mt-1 text-xs text-text-secondary">
          Cidadaos enviam ideias de negocio. JAZIDA cruza com demanda real da
          cidade, competicao e programas de capital semente. Cada idea financiada
          aqui e renda local recorrente — KPI direto pra ICMM PE9 / CSRD ESRS S3.
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
