// POST /api/demo/seed — popula DB com cidadaos/talents/complaints de exemplo
import { ok } from "@/lib/http";
import { runSeed } from "@/lib/seed";
import { seedDefaultUsers } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = runSeed();
  // Garante que usuarios existam (idempotente)
  seedDefaultUsers();
  return ok({
    seeded: true,
    counts: {
      citizens: result.citizens.length,
      talents: result.talents.length,
      complaints: result.complaints.length,
      alerts: result.alerts.length,
      users: db.users.length,
    },
  });
}
