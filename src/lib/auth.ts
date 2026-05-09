// Auth — sistema simples de login/registro com hash basico.
// Hackathon MVP — NAO usar em producao (hash inseguro, token simples).

import { db, newId, nowIso, saveDb } from "@/lib/db";
import type { Session, User, UserRole } from "@/types";
import { createHash, randomBytes } from "node:crypto";

// Hash simples (sha256) — hackathon only
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// ──────────────────────────────────────────────────────────
// Registro
// ──────────────────────────────────────────────────────────
export function registerUser(args: {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  citizenId?: string;
}): { user: User; session: Session } {
  const existing = db.users.find(
    (u) => u.username.toLowerCase() === args.username.toLowerCase()
  );
  if (existing) {
    throw new Error("Usuario ja existe");
  }

  if (args.password.length < 4) {
    throw new Error("Senha precisa ter pelo menos 4 caracteres");
  }

  const user: User = {
    id: newId(),
    username: args.username.toLowerCase(),
    passwordHash: hashPassword(args.password),
    role: args.role,
    citizenId: args.citizenId,
    displayName: args.displayName,
    createdAt: nowIso(),
  };

  db.users.push(user);

  const session = createSession(user);
  saveDb();

  return { user, session };
}

// ──────────────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────────────
export function loginUser(
  username: string,
  password: string
): { user: User; session: Session } {
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    throw new Error("Usuario ou senha incorretos");
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Usuario ou senha incorretos");
  }

  const session = createSession(user);
  saveDb();

  return { user, session };
}

// ──────────────────────────────────────────────────────────
// Sessao
// ──────────────────────────────────────────────────────────
function createSession(user: User): Session {
  // Limpa sessoes antigas do usuario
  db.sessions = db.sessions.filter((s) => s.userId !== user.id);

  const session: Session = {
    token: generateToken(),
    userId: user.id,
    role: user.role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  };

  db.sessions.push(session);
  return session;
}

export function validateSession(token: string): Session | null {
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    // Expirou — remove
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb();
    return null;
  }
  return session;
}

export function getUserById(userId: string): User | undefined {
  return db.users.find((u) => u.id === userId);
}

export function getUserBySession(token: string): User | null {
  const session = validateSession(token);
  if (!session) return null;
  return getUserById(session.userId) ?? null;
}

export function logout(token: string): void {
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDb();
}

// ──────────────────────────────────────────────────────────
// Seed de usuarios padrao
// ──────────────────────────────────────────────────────────
export function seedDefaultUsers(): void {
  if (db.users.length > 0) return;

  // Funcionarios da mineradora
  const employees = [
    { username: "admin", password: "admin123", displayName: "Administrador Vale" },
    { username: "sustentabilidade", password: "esg2026", displayName: "Equipe Sustentabilidade" },
    { username: "diretoria", password: "dir2026", displayName: "Diretoria ESG" },
  ];

  for (const e of employees) {
    const user: User = {
      id: newId(),
      username: e.username,
      passwordHash: hashPassword(e.password),
      role: "funcionario",
      displayName: e.displayName,
      createdAt: nowIso(),
    };
    db.users.push(user);
  }

  // Cidadaos pre-cadastrados (vinculados aos cidadaos do seed)
  const citizenUsers = [
    { username: "maria", password: "1234", displayName: "Maria Aparecida" },
    { username: "joao", password: "1234", displayName: "Joao Pedro" },
    { username: "ana", password: "1234", displayName: "Ana Lucia" },
    { username: "carlos", password: "1234", displayName: "Carlos Eduardo" },
    { username: "beatriz", password: "1234", displayName: "Beatriz Oliveira" },
  ];

  for (const c of citizenUsers) {
    // Tenta vincular ao cidadao existente pelo nome
    const citizen = db.citizens.find((cz) =>
      cz.name.toLowerCase().includes(c.displayName.split(" ")[0].toLowerCase())
    );

    const user: User = {
      id: newId(),
      username: c.username,
      passwordHash: hashPassword(c.password),
      role: "cidadao",
      citizenId: citizen?.id,
      displayName: c.displayName,
      createdAt: nowIso(),
    };
    db.users.push(user);
  }

  saveDb();
}
