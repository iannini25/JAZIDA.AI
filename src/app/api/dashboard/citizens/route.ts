// GET /api/dashboard/citizens — lista anonimizada com counts
import { db } from "@/lib/db";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const citizens = db.citizens.map((c) => ({
    id: c.id,
    cityId: c.cityId,
    // Anonimiza: primeiro nome + inicial do sobrenome
    name: anonymize(c.name),
    age: c.age,
    neighborhood: c.neighborhood,
    occupation: c.occupation,
    createdAt: c.createdAt,
    talentsCount: db.talents.filter((t) => t.citizenId === c.id).length,
    complaintsCount: db.complaints.filter((cm) => cm.citizenId === c.id)
      .length,
  }));
  return ok({ citizens, total: citizens.length });
}

function anonymize(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
