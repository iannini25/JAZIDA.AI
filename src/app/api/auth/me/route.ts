// GET /api/auth/me — retorna dados do usuario logado.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;

  const { user } = result;
  return NextResponse.json({
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    citizenId: user.citizenId,
  });
}
