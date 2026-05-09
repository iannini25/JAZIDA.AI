// GET /api/dashboard/alerts — alertas ativos
import { db } from "@/lib/db";
import { ok } from "@/lib/http";
import type { Alert } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const level = url.searchParams.get("level") as Alert["level"] | null;
  const alerts = level
    ? db.alerts.filter((a) => a.level === level)
    : db.alerts;
  return ok({
    alerts: [...alerts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    total: alerts.length,
  });
}
