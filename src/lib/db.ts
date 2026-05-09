// DB in-memory com persistencia opcional em JSON.
// Single-tenant (cidade default = 'mariana'). MVP de hackathon — sem banco.

import fs from "node:fs";
import path from "node:path";
import { customAlphabet, nanoid } from "nanoid";
import type {
  Alert,
  AgentEvent,
  BusinessIdea,
  CityId,
  Citizen,
  Complaint,
  ESGReportFragment,
  RateLimitEntry,
  ReplicaMessage,
  SentimentSnapshot,
  Session,
  TalentEntry,
  User,
} from "@/types";

export type DB = {
  citizens: Citizen[];
  talents: TalentEntry[];
  complaints: Complaint[];
  agentEvents: AgentEvent[];
  alerts: Alert[];
  replicas: ReplicaMessage[];
  esgFragments: ESGReportFragment[];
  businessIdeas: BusinessIdea[];
  // cache do ultimo snapshot por cidade
  sentimentByCity: Partial<Record<CityId, SentimentSnapshot>>;
  // contador para protocolNumber sequencial
  protocolCounter: number;
  // ideias marcadas como "vai financiar" (apenas state — nao move dinheiro)
  fundedIdeaIds: string[];
  // Auth
  users: User[];
  sessions: Session[];
  rateLimits: RateLimitEntry[];
};

function emptyDb(): DB {
  return {
    citizens: [],
    talents: [],
    complaints: [],
    agentEvents: [],
    alerts: [],
    replicas: [],
    esgFragments: [],
    businessIdeas: [],
    sentimentByCity: {},
    protocolCounter: 0,
    fundedIdeaIds: [],
    users: [],
    sessions: [],
    rateLimits: [],
  };
}

const DB_FILE = process.env.DB_FILE || "";

// ──────────────────────────────────────────────────────────
// Singleton (sobrevive a HMR do Next em dev)
// ──────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __jazidaDb: DB | undefined;
}

function loadFromFile(): DB | null {
  if (!DB_FILE) return null;
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return { ...emptyDb(), ...parsed };
  } catch (err) {
    console.warn("[db] falha ao carregar DB do arquivo:", err);
    return null;
  }
}

function ensureDbDir() {
  if (!DB_FILE) return;
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const db: DB = globalThis.__jazidaDb ?? loadFromFile() ?? emptyDb();
if (!globalThis.__jazidaDb) globalThis.__jazidaDb = db;

// ──────────────────────────────────────────────────────────
// Persistencia
// ──────────────────────────────────────────────────────────
export function saveDb(): void {
  if (!DB_FILE) return;
  try {
    ensureDbDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("[db] falha ao salvar DB:", err);
  }
}

export function loadDb(): DB {
  const fresh = loadFromFile();
  if (fresh) Object.assign(db, fresh);
  return db;
}

export function resetDb(): void {
  Object.assign(db, emptyDb());
  saveDb();
}

// ──────────────────────────────────────────────────────────
// IDs
// nanoid pra ids gerais; protocolNumber sequencial com padding.
// ──────────────────────────────────────────────────────────
const shortId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export function newId(): string {
  return shortId();
}

export function newNanoid(): string {
  return nanoid();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function genProtocolNumber(): string {
  db.protocolCounter += 1;
  const year = new Date().getFullYear();
  const seq = String(db.protocolCounter).padStart(5, "0");
  return `JZD-${year}-${seq}`;
}

// ──────────────────────────────────────────────────────────
// Pub/Sub para SSE.
// IMPORTANTE: o Set de listeners vive em globalThis (igual ao db).
// Se ficasse module-local, o SSE route handler e o orchestrator
// (que dispara emit) podiam acabar com instancias diferentes do Set
// em Next.js dev/HMR — listeners nao receberiam pushes.
// ──────────────────────────────────────────────────────────
type Listener = (event: AgentEvent) => void;

declare global {
  // eslint-disable-next-line no-var
  var __jazidaListeners: Set<Listener> | undefined;
}

const listeners: Set<Listener> =
  globalThis.__jazidaListeners ?? new Set<Listener>();
if (!globalThis.__jazidaListeners) globalThis.__jazidaListeners = listeners;

export function subscribeAgentEvents(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitAgentEvent(event: AgentEvent): void {
  db.agentEvents.unshift(event);
  if (db.agentEvents.length > 500) db.agentEvents.length = 500;
  saveDb();
  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      console.warn("[db] listener falhou:", err);
    }
  }
}
