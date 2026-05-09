# CLAUDE.md — JAZIDA AI (Hackathon Canastra)

## Sobre
**JAZIDA AI** e uma plataforma multi-agent de IA que mineradoras pagam pra reconstruir reputacao e licenca social em cidades pequenas dependentes de mineracao no Brasil (Mariana, Itabira, Brumadinho, Paracatu, Araxa, Parauapebas, Canaa dos Carajas).

3 stakeholders, 3 superficies, 1 plataforma:
- **App do Cidadao** (mobile-first web responsivo, white-label por cidade)
- **Dashboard da Mineradora** (desktop, executive-grade)
- **Backend Multi-Agent** (Next.js + Anthropic Claude SDK direto)

A fonte da verdade do produto/contrato esta em [00_contexto_master.md](./00_contexto_master.md). Os tipos, endpoints e cenarios de demo seguem 1:1 esse arquivo.

## Stack (DECIDIDO no master — nao mudar)
- **Framework:** Next.js 14 (App Router) + TypeScript + `src/`
- **Estilo:** Tailwind CSS 3 + shadcn/ui (a configurar quando frontend comecar)
- **LLM:** Anthropic Claude via `@anthropic-ai/sdk`, modelo `claude-sonnet-4-5`
- **Voz:** ElevenLabs (opcional, so se sobrar tempo)
- **Storage:** in-memory + JSON file ([src/lib/db.ts](src/lib/db.ts)). Sem banco real.
- **State streaming:** SSE em [src/app/api/dashboard/agent-events/stream/route.ts](src/app/api/dashboard/agent-events/stream/route.ts)
- **Deploy:** Replit / Vercel
- **Idioma:** comments/strings/UI em portugues, variaveis e funcoes em ingles.

## Estrutura
```
/src
  /types/index.ts                 fonte da verdade dos tipos (master 1:1)
  /lib
    db.ts                         in-memory + persistencia JSON + pub/sub SSE
    seed.ts                       5 cidadaos pre-populados de Mariana
    http.ts                       helpers de resposta JSON
    llm.ts                        (Fase 2) wrapper Anthropic
    orchestrator.ts               (Fase 2) dispatch de agents
    agents/
      prompts.ts                  (Fase 2) system prompts
      acolhida.ts | talento.ts | voz.ts | bussola.ts | replica.ts | pulsar.ts | pacto.ts
  /app
    layout.tsx | page.tsx | globals.css
    /api/...                      todas as rotas REST
```

## Comandos
- `pnpm dev` — dev server em http://localhost:3000
- `pnpm build` — build de producao (passa por validacao de tipos)
- `pnpm install --ignore-workspace` — primeira instalacao (precisa por causa de pnpm-workspace.yaml herdado do home dir)

## Smoke test (pos `pnpm dev`)
```bash
curl -X POST http://localhost:3000/api/demo/seed
curl http://localhost:3000/api/dashboard/sentiment
curl http://localhost:3000/api/dashboard/alerts
curl -X POST http://localhost:3000/api/demo/trigger/maria_enfermagem
curl "http://localhost:3000/api/dashboard/agent-events?limit=5"
```

## Regras inegociaveis (master)
1. **Nao inventar endpoints** fora do contrato — se precisar, alinhar antes.
2. **Usar tipos** de [src/types/index.ts](src/types/index.ts). Nao duplicar.
3. **Sem banco real** (Supabase/Postgres/etc).
4. **Funcionar > elegancia** — hackathon.
5. **Mock onde precisar** — Anthropic real e OK, mas tenha fallback (`DEMO_SAFE=true`).
6. **Tudo deployavel** em Replit/Vercel. Sem Docker.

## Variaveis de ambiente
Ver [.env.example](.env.example). Em dev sem `ANTHROPIC_API_KEY`, ative `DEMO_SAFE=true` pra agents responderem hardcoded.

---

## REGRA CRITICA — Sync automatico com GitHub

> Esta pasta deve estar 100% alinhada com `https://github.com/iannini25/JAZIDA.AI.git` o tempo todo.

Toda alteracao aqui e commitada e enviada pro remoto **automaticamente** via hook [.githooks/post-commit](./.githooks/post-commit) (configurado em `core.hooksPath=.githooks`).

### Fluxo apos qualquer mudanca:
```bash
git add -A
git commit -m "<mensagem descritiva>"
# o post-commit faz git push origin main sozinho
```

- Mensagens em portugues, modo imperativo (`add`, `update`, `fix`, `remove`).
- **Um commit por unidade logica** — nao acumular.
- **Nunca** `--no-verify` ou `force push` na main.
- Se push falhar (rede/credenciais/divergencia): fazer `git pull --rebase origin main`, resolver, e avisar o usuario explicitamente.
