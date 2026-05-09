// POST /api/demo/seed — popula DB com cidadaos/talents/complaints de exemplo
import { ok } from "@/lib/http";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = runSeed();
  return ok({
    seeded: true,
    counts: {
      citizens: result.citizens.length,
      talents: result.talents.length,
      complaints: result.complaints.length,
      alerts: result.alerts.length,
    },
  });
}
