// Smoke test: confirma que a chave do .env.local funciona contra a API real.
// Nao loga a chave; so loga status, modelo e o texto retornado.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq === -1) continue;
    const k = s.slice(0, eq).trim();
    const v = s.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvLocal();

const key = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const demoSafe = process.env.DEMO_SAFE === "true";

console.log("---- env check ----");
console.log("ANTHROPIC_API_KEY present:", Boolean(key));
console.log("ANTHROPIC_API_KEY length :", key ? key.length : 0);
console.log("ANTHROPIC_API_KEY prefix :", key ? key.slice(0, 12) + "..." : "(none)");
console.log("ANTHROPIC_MODEL          :", model);
console.log("DEMO_SAFE                :", demoSafe);

if (!key) {
  console.error("FAIL: sem chave no .env.local");
  process.exit(1);
}

const client = new Anthropic({ apiKey: key });

const t0 = Date.now();
try {
  const r = await client.messages.create({
    model,
    max_tokens: 60,
    messages: [
      { role: "user", content: "Responda apenas: PONG" },
    ],
  });
  const ms = Date.now() - t0;
  const text = r.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  console.log("---- live call ----");
  console.log("status   : OK");
  console.log("latency  :", ms + "ms");
  console.log("model    :", r.model);
  console.log("stop_rsn :", r.stop_reason);
  console.log("usage    :", JSON.stringify(r.usage));
  console.log("text     :", text.trim());
  process.exit(0);
} catch (err) {
  const ms = Date.now() - t0;
  console.log("---- live call ----");
  console.log("status   : FAIL");
  console.log("latency  :", ms + "ms");
  console.log("error    :", err?.status || "", err?.message || err);
  if (err?.error) console.log("body     :", JSON.stringify(err.error));
  process.exit(2);
}
