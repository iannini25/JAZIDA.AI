// POST /api/auth/logout — invalida a sessao.
import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";
import { extractToken } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (token) {
    logout(token);
  }
  return NextResponse.json({ ok: true });
}
