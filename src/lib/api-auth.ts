// Helpers de autenticacao para API routes (server-side).
// Extrai token do header Authorization: Bearer <token> e valida.

import { NextRequest, NextResponse } from "next/server";
import { validateSession, getUserById } from "@/lib/auth";
import type { Session, User, UserRole } from "@/types";

export type AuthContext = {
  session: Session;
  user: User;
};

export function extractToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const parts = header.split(" ");
  if (parts[0]?.toLowerCase() !== "bearer" || !parts[1]) return null;
  return parts[1];
}

export function authenticate(req: NextRequest): AuthContext | null {
  const token = extractToken(req);
  if (!token) return null;
  const session = validateSession(token);
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user) return null;
  return { session, user };
}

export function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): AuthContext | NextResponse {
  const ctx = authenticate(req);
  if (!ctx) {
    return NextResponse.json(
      { error: "Nao autenticado. Faca login primeiro." },
      { status: 401 }
    );
  }
  if (allowedRoles && !allowedRoles.includes(ctx.user.role)) {
    return NextResponse.json(
      { error: "Voce nao tem permissao pra acessar esse recurso." },
      { status: 403 }
    );
  }
  return ctx;
}
