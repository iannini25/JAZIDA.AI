// Rate limiting por usuario — controla quantas acoes por intervalo de tempo.
// Hackathon MVP — tudo in-memory via db.rateLimits.

import { db, saveDb } from "@/lib/db";

// Configuracao de limites por tipo de acao
const LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  talent: { maxRequests: 5, windowMs: 60 * 60 * 1000 },      // 5 talentos por hora
  complaint: { maxRequests: 3, windowMs: 60 * 60 * 1000 },    // 3 queixas por hora
  idea: { maxRequests: 3, windowMs: 60 * 60 * 1000 },         // 3 ideias por hora
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string; // ISO
  limitPerWindow: number;
};

export function checkRateLimit(
  userId: string,
  action: string
): RateLimitResult {
  const config = LIMITS[action];
  if (!config) {
    return {
      allowed: true,
      remaining: 999,
      resetAt: new Date(Date.now() + 3600_000).toISOString(),
      limitPerWindow: 999,
    };
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Busca ou cria entry
  let entry = db.rateLimits.find(
    (e) => e.userId === userId && e.action === action
  );
  if (!entry) {
    entry = { userId, action, timestamps: [] };
    db.rateLimits.push(entry);
  }

  // Limpa timestamps fora da janela
  entry.timestamps = entry.timestamps.filter(
    (ts) => new Date(ts).getTime() > windowStart
  );

  const count = entry.timestamps.length;
  const remaining = Math.max(0, config.maxRequests - count);

  // Calcula quando o proximo slot abre (timestamp mais antigo + window)
  const oldestInWindow = entry.timestamps[0];
  const resetAt = oldestInWindow
    ? new Date(new Date(oldestInWindow).getTime() + config.windowMs).toISOString()
    : new Date(now + config.windowMs).toISOString();

  if (count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limitPerWindow: config.maxRequests,
    };
  }

  return {
    allowed: true,
    remaining: remaining - 1, // -1 porque vai usar agora
    resetAt,
    limitPerWindow: config.maxRequests,
  };
}

export function recordAction(userId: string, action: string): void {
  let entry = db.rateLimits.find(
    (e) => e.userId === userId && e.action === action
  );
  if (!entry) {
    entry = { userId, action, timestamps: [] };
    db.rateLimits.push(entry);
  }
  entry.timestamps.push(new Date().toISOString());
  saveDb();
}

export function getRateLimitInfo(
  userId: string,
  action: string
): RateLimitResult {
  return checkRateLimit(userId, action);
}
