// Cliente API tipado pro Dashboard da Mineradora.
// SSE via EventSource nativo do browser.

import type {
  Alert,
  AgentEvent,
  BusinessIdea,
  Citizen,
  CitizenHistory,
  CityId,
  Conditionant,
  ConditionantStatus,
  ESGFramework,
  ESGReportFragment,
  OpportunityAggregate,
  ReplicaMessage,
  SentimentSnapshot,
} from "@/types";

const baseUrl =
  typeof window !== "undefined" ? "" : process.env.APP_BASE_URL || "";

function url(path: string): string {
  return `${baseUrl}${path}`;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ──────────────────────────────────────────────────────────
// Sentiment
// ──────────────────────────────────────────────────────────
export async function getSentiment(
  cityId: CityId = "mariana"
): Promise<SentimentSnapshot> {
  const res = await fetch(url(`/api/dashboard/sentiment?cityId=${cityId}`), {
    cache: "no-store",
  });
  return jsonOrThrow<SentimentSnapshot>(res);
}

// ──────────────────────────────────────────────────────────
// Alerts
// ──────────────────────────────────────────────────────────
export async function getAlerts(): Promise<Alert[]> {
  const res = await fetch(url(`/api/dashboard/alerts`), { cache: "no-store" });
  const data = await jsonOrThrow<{ alerts: Alert[]; total: number }>(res);
  return data.alerts;
}

// ──────────────────────────────────────────────────────────
// Agent events (snapshot via REST + live via SSE)
// ──────────────────────────────────────────────────────────
export async function getAgentEvents(limit = 30): Promise<AgentEvent[]> {
  const res = await fetch(
    url(`/api/dashboard/agent-events?limit=${limit}`),
    { cache: "no-store" }
  );
  const data = await jsonOrThrow<{ events: AgentEvent[]; total: number }>(res);
  return data.events;
}

export type StreamHandlers = {
  onSnapshot?: (events: AgentEvent[]) => void;
  onEvent?: (event: AgentEvent) => void;
  onHeartbeat?: (ts: string) => void;
  onError?: (err: unknown) => void;
};

/**
 * Conecta no SSE de agent events. Retorna cleanup function.
 *
 * Uso:
 *   useEffect(() => {
 *     const close = streamAgentEvents({ onEvent: e => ... });
 *     return close;
 *   }, []);
 */
export function streamAgentEvents(handlers: StreamHandlers): () => void {
  if (typeof window === "undefined") return () => {};

  const es = new EventSource(url("/api/dashboard/agent-events/stream"));

  es.addEventListener("snapshot", (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data) as {
        events: AgentEvent[];
      };
      handlers.onSnapshot?.(data.events);
    } catch (err) {
      handlers.onError?.(err);
    }
  });

  es.addEventListener("agent-event", (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data) as AgentEvent;
      handlers.onEvent?.(data);
    } catch (err) {
      handlers.onError?.(err);
    }
  });

  es.addEventListener("heartbeat", (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data) as { ts: string };
      handlers.onHeartbeat?.(data.ts);
    } catch (err) {
      handlers.onError?.(err);
    }
  });

  es.onerror = (err) => {
    handlers.onError?.(err);
  };

  return () => {
    try {
      es.close();
    } catch {
      /* noop */
    }
  };
}

// ──────────────────────────────────────────────────────────
// Citizens (anonimizados)
// ──────────────────────────────────────────────────────────
export type DashboardCitizen = Citizen & {
  talentsCount: number;
  complaintsCount: number;
};

export async function getDashboardCitizens(): Promise<DashboardCitizen[]> {
  const res = await fetch(url(`/api/dashboard/citizens`), {
    cache: "no-store",
  });
  const data = await jsonOrThrow<{
    citizens: DashboardCitizen[];
    total: number;
  }>(res);
  return data.citizens;
}

export async function getCitizenHistory(
  citizenId: string
): Promise<CitizenHistory> {
  const res = await fetch(url(`/api/citizens/${citizenId}/history`), {
    cache: "no-store",
  });
  return jsonOrThrow<CitizenHistory>(res);
}

// ──────────────────────────────────────────────────────────
// Replica (aprovacao manual / batch)
// ──────────────────────────────────────────────────────────
export async function approveReplica(args: {
  citizenId: string;
  message?: string;
  trigger?: ReplicaMessage["trigger"];
  triggerId?: string;
  approvedBy?: string;
}): Promise<ReplicaMessage> {
  const res = await fetch(url(`/api/dashboard/replica/approve`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  return jsonOrThrow<ReplicaMessage>(res);
}

// ──────────────────────────────────────────────────────────
// ESG report
// ──────────────────────────────────────────────────────────
export type EsgReportResponse = {
  framework: ESGFramework;
  cityId: CityId;
  period: string;
  fragments: ESGReportFragment[];
  generatedAt: string;
};

export async function generateEsgReport(opts: {
  framework?: ESGFramework;
  cityId?: CityId;
  period?: string;
}): Promise<EsgReportResponse> {
  const res = await fetch(url(`/api/dashboard/esg-report`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
    cache: "no-store",
  });
  return jsonOrThrow<EsgReportResponse>(res);
}

// ──────────────────────────────────────────────────────────
// Oportunidades (Semente / just transition)
// ──────────────────────────────────────────────────────────
export type OpportunitiesResponse = {
  aggregates: OpportunityAggregate[];
  totals: {
    ideasAnalyzed: number;
    highFitTotal: number;
    capexSuggested: number;
    fundedCount: number;
  };
};

export async function getOpportunities(): Promise<OpportunitiesResponse> {
  const res = await fetch(url(`/api/dashboard/opportunities`), {
    cache: "no-store",
  });
  return jsonOrThrow<OpportunitiesResponse>(res);
}

export async function fundOpportunity(ideaId: string): Promise<{
  ideaId: string;
  status: string;
  funded: boolean;
}> {
  const res = await fetch(
    url(`/api/dashboard/opportunities/${ideaId}/fund`),
    { method: "POST", cache: "no-store" }
  );
  return jsonOrThrow(res);
}

// ──────────────────────────────────────────────────────────
// Indicadores municipais (IBGE / INEP / ANM / DataSUS)
// ──────────────────────────────────────────────────────────
export type MunicipalIndicatorsDTO = {
  cityId: CityId;
  populacao: number;
  idh: number;
  ideb: number;
  pibMunicipal: number;
  evasaoEscolar: number;
  cfemAnualReceived: number;
  saneamentoBasico: number;
  doencasRespiratorias: number;
  dependenciaMineral: number;
  ibgeCode: string;
  uf: string;
  populacaoEstimadaIBGE: number;
  lastUpdated: string;
};

export async function getMunicipalIndicators(
  cityId: CityId
): Promise<MunicipalIndicatorsDTO | null> {
  const res = await fetch(
    url(`/api/dashboard/municipal-indicators?cityId=${cityId}`),
    { cache: "no-store" }
  );
  return jsonOrThrow<MunicipalIndicatorsDTO | null>(res);
}

// ──────────────────────────────────────────────────────────
// Condicionantes ambientais e regulatorias
// ──────────────────────────────────────────────────────────
export type ConditionantsResponse = {
  conditionants: Conditionant[];
  summary: {
    total: number;
    emPrazo: number;
    emRisco: number;
    vencidas: number;
    nextDeadline?: string;
  };
};

export async function getConditionants(opts?: {
  cityId?: CityId;
  status?: ConditionantStatus;
}): Promise<ConditionantsResponse> {
  const params = new URLSearchParams();
  if (opts?.cityId) params.set("cityId", opts.cityId);
  if (opts?.status) params.set("status", opts.status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(url(`/api/dashboard/conditionants${qs}`), {
    cache: "no-store",
  });
  return jsonOrThrow<ConditionantsResponse>(res);
}

// ──────────────────────────────────────────────────────────
// Demo triggers (consumido pelo widget de live demo)
// ──────────────────────────────────────────────────────────
export type DemoScenarioId =
  | "maria_enfermagem"
  | "joaozinho_poeira"
  | "beatriz_costura";

export async function triggerDemoScenario(
  scenario: DemoScenarioId
): Promise<unknown> {
  const res = await fetch(url(`/api/demo/trigger/${scenario}`), {
    method: "POST",
    cache: "no-store",
  });
  return jsonOrThrow(res);
}

export async function seedDemo(): Promise<unknown> {
  const res = await fetch(url(`/api/demo/seed`), {
    method: "POST",
    cache: "no-store",
  });
  return jsonOrThrow(res);
}
