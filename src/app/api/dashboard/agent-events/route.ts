// GET /api/dashboard/agent-events?since=&limit=&agent= — feed snapshot
import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import type { AgentName } from "@/types";

export const dynamic = "force-dynamic";

const KNOWN_AGENTS: AgentName[] = [
  "Acolhida",
  "Talento",
  "Voz",
  "Bussola",
  "Replica",
  "Pulsar",
  "Pacto",
  "Semente",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const agentParam = url.searchParams.get("agent");

  let events = db.agentEvents;

  if (sinceParam) {
    const since = new Date(sinceParam).getTime();
    if (!Number.isNaN(since)) {
      events = events.filter(
        (e) => new Date(e.timestamp).getTime() > since
      );
    }
  }

  if (agentParam && KNOWN_AGENTS.includes(agentParam as AgentName)) {
    events = events.filter((e) => e.agentName === agentParam);
  }

  return ok({
    events: events.slice(0, limit),
    total: events.length,
  });
}
