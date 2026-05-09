// Helpers HTTP — respostas JSON consistentes e tratamento de erro humano.
import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data as object, { status: 200, ...init });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data as object, { status: 201 });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: "bad_request", message, details },
    { status: 400 }
  );
}

export function notFound(message = "nao encontrado"): NextResponse {
  return NextResponse.json({ error: "not_found", message }, { status: 404 });
}

export function serverError(
  message = "estamos com instabilidade, tenta de novo em 1 min",
  details?: unknown
): NextResponse {
  console.error("[http] server error:", message, details);
  return NextResponse.json(
    { error: "server_error", message, details: serializeError(details) },
    { status: 500 }
  );
}

function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  return err;
}

export async function safeJson<T = unknown>(
  req: Request
): Promise<T | undefined> {
  try {
    return (await req.json()) as T;
  } catch {
    return undefined;
  }
}
