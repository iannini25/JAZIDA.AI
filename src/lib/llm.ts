// Wrapper unico para chamar Anthropic Claude.
// Toda chamada de LLM passa por aqui — facilita retry, log, swap pra Bedrock,
// e ativacao do DEMO_SAFE.

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_DEFAULT =
  process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

if (!ANTHROPIC_KEY && process.env.DEMO_SAFE !== "true") {
  console.warn(
    "[llm] ANTHROPIC_API_KEY nao definido. Defina DEMO_SAFE=true ou configure a chave."
  );
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: ANTHROPIC_KEY || "" });
  }
  return _client;
}

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClaudeTool = any;

export type CallClaudeOpts = {
  system: string;
  messages: ClaudeMessage[];
  tools?: ClaudeTool[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type CallClaudeResult = {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolUses: any[];
  raw: unknown;
};

export function isDemoSafe(): boolean {
  return process.env.DEMO_SAFE === "true";
}

export function hasApiKey(): boolean {
  return Boolean(ANTHROPIC_KEY);
}

/**
 * Chama Claude. Concatena toda a saida de texto em `text` e tool_uses em `toolUses`.
 * Levanta erro se falhar — caller deve fazer try/catch e fallback.
 */
export async function callClaude(
  opts: CallClaudeOpts
): Promise<CallClaudeResult> {
  if (!hasApiKey()) {
    throw new Error("ANTHROPIC_API_KEY nao configurado");
  }

  const model = opts.model || MODEL_DEFAULT;
  const maxTokens = opts.maxTokens ?? 1024;

  const response = await client().messages.create({
    model,
    max_tokens: maxTokens,
    temperature: opts.temperature,
    system: opts.system,
    messages: opts.messages,
    tools: opts.tools,
  });

  let text = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolUses: any[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use") {
      toolUses.push(block);
    }
  }

  return { text, toolUses, raw: response };
}

/**
 * Helper: chama Claude esperando JSON puro de volta. Tenta parse direto;
 * se vier com texto antes/depois, extrai o primeiro objeto/array `{...}` ou `[...]`.
 * Use com prompts que dizem "responda APENAS com JSON".
 */
export async function callClaudeJson<T = unknown>(
  opts: CallClaudeOpts
): Promise<T> {
  const result = await callClaude(opts);
  return parseJsonLoose<T>(result.text);
}

export function parseJsonLoose<T = unknown>(text: string): T {
  const trimmed = text.trim();
  // Tenta direto
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continua
  }
  // Procura primeiro { ... } ou [ ... ] balanceado
  const candidate = extractFirstJson(trimmed);
  if (!candidate) {
    throw new Error("LLM nao retornou JSON parseavel: " + trimmed.slice(0, 120));
  }
  return JSON.parse(candidate) as T;
}

function extractFirstJson(s: string): string | null {
  const openers = new Map([
    ["{", "}"],
    ["[", "]"],
  ]);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const close = openers.get(ch);
    if (!close) continue;
    let depth = 0;
    let inStr = false;
    let escape = false;
    for (let j = i; j < s.length; j++) {
      const cj = s[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (cj === "\\") {
        escape = true;
        continue;
      }
      if (cj === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (cj === ch) depth++;
      else if (cj === close) {
        depth--;
        if (depth === 0) return s.slice(i, j + 1);
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────
// Logger leve para chamadas de agent.
// ──────────────────────────────────────────────────────────
export function logAgentCall(
  agent: string,
  ms: number,
  status: "ok" | "fallback" | "error",
  extra?: Record<string, unknown>
): void {
  const ts = new Date().toISOString();
  const tag =
    status === "ok" ? "[ok]" : status === "fallback" ? "[fallback]" : "[err]";
  const meta = extra ? " " + JSON.stringify(extra) : "";
  console.log(`${ts} [agent:${agent}] ${tag} ${ms}ms${meta}`);
}
