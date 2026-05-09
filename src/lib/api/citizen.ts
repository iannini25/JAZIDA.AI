// Cliente API tipado para as rotas que o App do Cidadao consome.
// Usa fetch nativo (no cache, force-dynamic). Tipos vem de @/types.

import type {
  Citizen,
  CitizenHistory,
  Complaint,
  TalentEntry,
} from "@/types";

const baseUrl =
  typeof window !== "undefined" ? "" : process.env.APP_BASE_URL || "";

function url(path: string): string {
  return `${baseUrl}${path}`;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message || body?.error || `HTTP ${res.status}: ${res.statusText}`
    );
  }
  return (await res.json()) as T;
}

// ──────────────────────────────────────────────────────────
// Cidadao
// ──────────────────────────────────────────────────────────
export async function createCitizen(
  data: Partial<Citizen>
): Promise<Citizen> {
  const res = await fetch(url("/api/citizens"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  return jsonOrThrow<Citizen>(res);
}

export async function getCitizen(id: string): Promise<Citizen> {
  const res = await fetch(url(`/api/citizens/${id}`), { cache: "no-store" });
  return jsonOrThrow<Citizen>(res);
}

// ──────────────────────────────────────────────────────────
// Talentos
// ──────────────────────────────────────────────────────────
export type AddTalentResponse = {
  talentId: string;
  status: "processing" | "done";
};

export async function addTalent(
  citizenId: string,
  rawInput: string,
  type: TalentEntry["type"] = "aspiration"
): Promise<AddTalentResponse> {
  const res = await fetch(url(`/api/citizens/${citizenId}/talents`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawInput, type }),
    cache: "no-store",
  });
  return jsonOrThrow<AddTalentResponse>(res);
}

export async function listTalents(citizenId: string): Promise<TalentEntry[]> {
  const res = await fetch(url(`/api/citizens/${citizenId}/talents`), {
    cache: "no-store",
  });
  const json = await jsonOrThrow<{ talents: TalentEntry[] }>(res);
  return json.talents;
}

/**
 * Faz polling em /talents ate o entry de `talentId` ter `matches` populado.
 * Resolve com o TalentEntry final ou rejeita apos `timeoutMs`.
 */
export async function pollForMatches(
  citizenId: string,
  talentId: string,
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<TalentEntry> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const intervalMs = options.intervalMs ?? 600;
  const start = Date.now();
  // tentativa imediata + polling
  while (Date.now() - start < timeoutMs) {
    const talents = await listTalents(citizenId).catch(() => [] as TalentEntry[]);
    const t = talents.find((x) => x.id === talentId);
    if (t && t.matches && t.matches.length > 0) return t;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timeout esperando matches da Bussola");
}

// ──────────────────────────────────────────────────────────
// Queixas / sugestoes
// ──────────────────────────────────────────────────────────
export type SubmitComplaintInput = {
  rawInput: string;
  type: "complaint" | "suggestion";
  photoUrl?: string;
};

export async function submitComplaint(
  citizenId: string,
  payload: SubmitComplaintInput
): Promise<{ complaint: Complaint; alert: unknown | null }> {
  const res = await fetch(url(`/api/citizens/${citizenId}/complaints`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return jsonOrThrow<{ complaint: Complaint; alert: unknown | null }>(res);
}

// ──────────────────────────────────────────────────────────
// Historico
// ──────────────────────────────────────────────────────────
export async function getHistory(
  citizenId: string
): Promise<CitizenHistory> {
  const res = await fetch(url(`/api/citizens/${citizenId}/history`), {
    cache: "no-store",
  });
  return jsonOrThrow<CitizenHistory>(res);
}

// ──────────────────────────────────────────────────────────
// Demo helpers
// ──────────────────────────────────────────────────────────
export async function seedDemo(): Promise<{
  seeded: boolean;
  counts: Record<string, number>;
}> {
  const res = await fetch(url(`/api/demo/seed`), {
    method: "POST",
    cache: "no-store",
  });
  return jsonOrThrow(res);
}

export async function listDashboardCitizens(): Promise<{
  citizens: (Citizen & { talentsCount: number; complaintsCount: number })[];
  total: number;
}> {
  const res = await fetch(url(`/api/dashboard/citizens`), {
    cache: "no-store",
  });
  return jsonOrThrow(res);
}

/**
 * Lista cidadaos com nome COMPLETO (sem anonimizacao). Usado pelo app
 * do cidadao para os hacks de demo (?demo=maria|joao).
 */
export async function listCitizens(): Promise<{ citizens: Citizen[] }> {
  const res = await fetch(url(`/api/citizens`), { cache: "no-store" });
  return jsonOrThrow<{ citizens: Citizen[] }>(res);
}
