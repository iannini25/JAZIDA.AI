// GET /api/citizens/:id
import { db } from "@/lib/db";
import { notFound, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const citizen = db.citizens.find((c) => c.id === ctx.params.id);
  if (!citizen) return notFound("cidadao nao encontrado");
  return ok(citizen);
}
