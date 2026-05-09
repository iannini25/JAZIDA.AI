// POST /api/auth/register — cria novo usuario + cidadao (se role=cidadao).
import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { db, newId, nowIso, saveDb } from "@/lib/db";
import type { Citizen, CityId, UserRole } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      username,
      password,
      role,
      displayName,
      neighborhood,
      cityId,
    } = body as {
      username: string;
      password: string;
      role: UserRole;
      displayName: string;
      neighborhood?: string;
      cityId?: CityId;
    };

    if (!username || !password || !role || !displayName) {
      return NextResponse.json(
        { error: "Campos obrigatorios: username, password, role, displayName." },
        { status: 400 }
      );
    }

    if (role !== "cidadao" && role !== "funcionario") {
      return NextResponse.json(
        { error: "Role deve ser 'cidadao' ou 'funcionario'." },
        { status: 400 }
      );
    }

    let citizenId: string | undefined;

    // Se for cidadao, cria entry na tabela de cidadaos tambem
    if (role === "cidadao") {
      const citizen: Citizen = {
        id: newId(),
        cityId: cityId || "mariana",
        name: displayName,
        neighborhood: neighborhood || undefined,
        createdAt: nowIso(),
      };
      db.citizens.push(citizen);
      citizenId = citizen.id;
      saveDb();
    }

    const { user, session } = registerUser({
      username,
      password,
      role,
      displayName,
      citizenId,
    });

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
      { error: err instanceof Error ? err.message : "Erro ao registrar." },
      { status: 400 }
    );
  }
}
