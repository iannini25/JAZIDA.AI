// Cliente API de autenticacao (client-side).
import { getAuthToken } from "@/lib/auth-storage";

const baseUrl =
  typeof window !== "undefined" ? "" : process.env.APP_BASE_URL || "";

function url(path: string): string {
  return `${baseUrl}${path}`;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export type LoginResponse = {
  token: string;
  role: "cidadao" | "funcionario";
  userId: string;
  displayName: string;
  citizenId?: string;
  expiresAt: string;
};

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(url("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });
  return jsonOrThrow<LoginResponse>(res);
}

export async function register(args: {
  username: string;
  password: string;
  role: "cidadao" | "funcionario";
  displayName: string;
  neighborhood?: string;
  cityId?: string;
}): Promise<LoginResponse> {
  const res = await fetch(url("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  return jsonOrThrow<LoginResponse>(res);
}

export async function logout(): Promise<void> {
  const token = getAuthToken();
  await fetch(url("/api/auth/logout"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  }).catch(() => {});
}

export async function getMe(): Promise<{
  userId: string;
  username: string;
  role: "cidadao" | "funcionario";
  displayName: string;
  citizenId?: string;
} | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(url("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export type RateLimitInfo = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limitPerWindow: number;
};

export async function getRateLimit(action: string): Promise<RateLimitInfo | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(url(`/api/auth/rate-limit?action=${action}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
