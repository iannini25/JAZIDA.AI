// GET /api/citizens/:id/ideas/:ideaId — busca ideia especifica
import { db } from "@/lib/db";
import { notFound, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: { id: string; ideaId: string } }
) {
  const idea = db.businessIdeas.find(
    (i) => i.id === ctx.params.ideaId && i.citizenId === ctx.params.id
  );
  if (!idea) return notFound("ideia nao encontrada");
  return ok(idea);
}
