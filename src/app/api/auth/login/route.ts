// POST /api/auth/login — autentica usuario e retorna sessao.
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario e senha sao obrigatorios." },
        { status: 400 }
      );
    }

    const { user, session } = loginUser(username, password);

    return NextResponse.json({
      token: session.token,
      role: user.role,
      userId: user.id,
      displayName: user.displayName,
      citizenId: user.citizenId,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao fazer login." },
      { status: 401 }
    );
  }
}
