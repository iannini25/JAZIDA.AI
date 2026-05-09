// GET /api/auth/rate-limit?action=talent — consulta limite restante do usuario.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getRateLimitInfo } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;

  const action = req.nextUrl.searchParams.get("action") || "talent";
  const info = getRateLimitInfo(result.user.id, action);

  return NextResponse.json(info);
}
