// POST /api/citizens — cria cidadao
// GET  /api/citizens — lista (alias de /api/dashboard/citizens; util pro app)
import { db, newId, nowIso, saveDb } from "@/lib/db";
import { badRequest, created, ok, safeJson } from "@/lib/http";
import type { CityId, Citizen } from "@/types";

export const dynamic = "force-dynamic";

const VALID_CITIES: CityId[] = ["mariana", "itabira", "paracatu", "araxa"];

function isCityId(v: unknown): v is CityId {
  return typeof v === "string" && VALID_CITIES.includes(v as CityId);
}

export async function POST(req: Request) {
  const body = await safeJson<Partial<Citizen>>(req);
  if (!body || !body.name) {
    return badRequest("campo 'name' obrigatorio", { received: body });
  }

  const cityIdRaw =
    body.cityId ?? (process.env.DEFAULT_CITY_ID as string | undefined) ?? "mariana";
  if (!isCityId(cityIdRaw)) {
    return badRequest(
      `cityId deve ser um de: ${VALID_CITIES.join(", ")}`,
      { received: cityIdRaw }
    );
  }

  const citizen: Citizen = {
    id: newId(),
    cityId: cityIdRaw,
    name: body.name,
    age: body.age,
    neighborhood: body.neighborhood,
    occupation: body.occupation,
    phone: body.phone,
    createdAt: nowIso(),
  };
  db.citizens.push(citizen);
  saveDb();
  return created(citizen);
}

export async function GET() {
  return ok({ citizens: db.citizens });
}
