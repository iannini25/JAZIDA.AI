# JAZIDA AI — Contexto Master
## Cole isto no TOPO de qualquer prompt que você dar pra Cursor / Claude Code / Replit Agent.

---

## O que é JAZIDA AI

JAZIDA AI é uma plataforma multi-agent de IA que mineradoras pagam para reconstruir reputação e licença social em cidades pequenas dependentes de mineração no Brasil (Mariana, Itabira, Brumadinho, Paracatu, Araxá, Parauapebas, Canaã dos Carajás).

A plataforma escuta cidadãos via WhatsApp/web, estrutura suas demandas e talentos, sugere alocação de orçamento ESG, alerta riscos reputacionais antes que viram protesto, gera relatórios ESG auditáveis (CSRD/CVM 59), e prepara a cidade pra sobreviver economicamente sem a mineradora um dia ("just transition" — agenda regulatória ICMM).

3 stakeholders, 3 superfícies, 1 plataforma:
- **App do Cidadão** (mobile-first web responsivo, white-label por cidade) — Maria da banca cadastra talento, manda queixa por voz, recebe resposta humanizada
- **Dashboard da Mineradora** (desktop) — diretoria de Sustentabilidade vê sentimento, alertas, ROI de ISC, gera ESG report
- **Backend Multi-Agent** (server) — 14 agents em 5 camadas, MVP usa 5

---

## Tech Stack (DECIDIDO — não mudar)

- **Framework único:** Next.js 14 (App Router) + TypeScript
- **Estilo:** Tailwind CSS + shadcn/ui
- **LLM:** Anthropic Claude via SDK direto (`@anthropic-ai/sdk`) — modelo `claude-sonnet-4-5`. Wrapper preparado pra trocar pra Bedrock se sobrar tempo.
- **Voz:** ElevenLabs API (entrada/saída) — opcional, só se sobrar tempo
- **Storage:** in-memory + JSON file (pra hackathon). Sem banco. (`/lib/db.ts` exporta um objeto `db` com arrays).
- **State streaming:** Server-Sent Events (SSE) pro dashboard ver agents trabalhando ao vivo
- **Deploy:** Replit (créditos do hackathon). Single deployment.

```bash
# Setup inicial
npx create-next-app@latest jazida --typescript --tailwind --app --src-dir
cd jazida
npm install @anthropic-ai/sdk zod nanoid date-fns
npx shadcn@latest init -d
npx shadcn@latest add button card input textarea badge avatar progress
```

Variáveis de ambiente (`.env.local`):
```
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...      # opcional
NEXT_PUBLIC_DEMO_CITY=mariana
NEXT_PUBLIC_DEMO_MINERADORA=Vale
```

---

## Os 5 agents do MVP (subset dos 14)

| # | Agent | Camada | Função | Dispara |
|---|---|---|---|---|
| 1 | **Acolhida** | Coleta | Onboarding + roteamento inicial | Sempre no primeiro contato |
| 2 | **Talento** | Coleta | Estrutura habilidades, sonhos, profissões aspiracionais | App: aba Talento |
| 3 | **Voz** | Coleta | Estrutura queixas e sugestões com classificação | App: aba Voz |
| 4 | **Bússola** | Inteligência | Cruza talento × oportunidades (cursos, vagas, MEI) | Após Talento |
| 5 | **Réplica** | Ação | Gera resposta humanizada ao cidadão ("Maria, fizemos X a seu pedido") | Dashboard mineradora aprova ação |

E 2 agents agregadores que rodam por trás:
- **Pulsar** (Inteligência) — agrega sentimento da cidade pra dashboard
- **Pacto** (Ação) — gera fragmento de ESG report

---

## Contrato de API (FONTE DA VERDADE)

Tudo é REST + JSON. Endpoints sob `/api/*`. Todos os tipos em `/src/types/index.ts`.

### Tipos compartilhados (criar em `/src/types/index.ts`)

```typescript
export type CityId = "mariana" | "itabira" | "paracatu" | "araxa";

export type Citizen = {
  id: string;                    // nanoid
  cityId: CityId;
  name: string;
  age?: number;
  neighborhood?: string;
  phone?: string;
  occupation?: string;
  createdAt: string;             // ISO
};

export type TalentEntry = {
  id: string;
  citizenId: string;
  rawInput: string;              // o que cidadão disse
  type: "skill" | "aspiration" | "best_at" | "want_to_learn";
  structured: {
    label: string;               // ex: "enfermagem"
    category: string;            // ex: "saúde"
    confidence: number;          // 0-1
  };
  matches?: BussolaMatch[];      // populado depois pela Bússola
  createdAt: string;
};

export type BussolaMatch = {
  type: "course" | "job" | "entrepreneurship";
  title: string;                 // ex: "Curso Técnico em Enfermagem - SENAI Mariana"
  description: string;
  duration?: string;             // "24 meses"
  cost?: string;                 // "Bolsa Vale Fundação - R$ 0"
  link?: string;
  fitScore: number;              // 0-1
};

export type Complaint = {
  id: string;
  citizenId: string;
  rawInput: string;
  type: "complaint" | "suggestion";
  classification: {
    category: string;            // ex: "ar/poeira"
    urgency: "low" | "medium" | "high";
    impact: "individual" | "collective";
    neighborhood?: string;
  };
  protocolNumber: string;        // gerado: "JZD-2026-00123"
  status: "open" | "in_progress" | "resolved";
  resolvedAction?: string;
  createdAt: string;
};

export type AgentEvent = {
  id: string;
  agentName: "Acolhida" | "Talento" | "Voz" | "Bussola" | "Replica" | "Pulsar" | "Pacto";
  action: string;                // ex: "Classificou aspiração: enfermagem"
  citizenId?: string;
  payload?: any;
  timestamp: string;
};

export type SentimentSnapshot = {
  current: number;               // -1 a +1
  trend: "up" | "down" | "stable";
  topThemes: { label: string; sentiment: number; count: number }[];
  byNeighborhood: { name: string; sentiment: number }[];
  generatedAt: string;
};

export type Alert = {
  id: string;
  level: "warning" | "alert" | "critical";
  title: string;
  description: string;
  recommendedAction: string;
  createdAt: string;
};

export type ESGReportFragment = {
  section: string;               // ex: "Engajamento Comunitário"
  framework: "CSRD" | "CVM59" | "GRI" | "ICMM";
  content: string;               // texto gerado
  evidence: { type: string; reference: string }[];
};
```

### Endpoints

```
# Cidadão (chamados pelo App)
POST   /api/citizens                              criar cidadão
GET    /api/citizens/:id                          buscar
POST   /api/citizens/:id/talents                  adicionar talento (dispara Talento + Bússola)
POST   /api/citizens/:id/complaints               registrar queixa (dispara Voz)
GET    /api/citizens/:id/history                  timeline pessoal

# Mineradora (chamados pelo Dashboard)
GET    /api/dashboard/sentiment                   snapshot atual de sentimento
GET    /api/dashboard/alerts                      alertas ativos
GET    /api/dashboard/agent-events?since=         eventos de agents (pra feed live)
GET    /api/dashboard/agent-events/stream         SSE stream de eventos novos
POST   /api/dashboard/replica/approve             aprova mensagem de Réplica pra disparar
POST   /api/dashboard/esg-report                  gera draft de ESG report
GET    /api/dashboard/citizens                    lista cidadãos (anonimizados)

# Demo control (pra disparar cenários durante o pitch)
POST   /api/demo/seed                             popula dados de demo
POST   /api/demo/trigger/:scenario                roda cenário pré-definido
                                                  cenários: maria_enfermagem, joaozinho_poeira
```

---

## Cenários de demo (FONTE DA VERDADE)

A demo de 90s passa por 2 cenários. Hardcode esses dados.

### Cenário 1: Maria pede enfermagem (mostra Talento + Bússola + Réplica)
```
- Cidade: Mariana, MG
- Cidadã: Maria Aparecida, 47, dona-de-casa, bairro Santo Antônio
- Input por voz: "alô, queria saber se minha filha de 17 anos consegue uma bolsa pra estudar enfermagem"
- Bússola retorna 3 matches:
  1. Curso Técnico em Enfermagem - SENAI Mariana (24 meses, bolsa Vale Fundação)
  2. Vaga de Auxiliar de Enfermagem - Hospital Monsenhor Horta (CLT, 8 vagas)
  3. Programa Sebrae Saúde Domiciliar - microempreendedorismo (6 meses)
- Réplica gera: "Maria, achei 3 caminhos pra sua filha. A Vale Fundação tem bolsa pro curso técnico SENAI - quer que eu já faça pré-cadastro?"
```

### Cenário 2: Joãozinho reclama de poeira (mostra Voz + Pulsar + Vigia)
```
- Cidade: Mariana, MG
- Cidadão: João Pedro, 38, padeiro, bairro Centro
- Input por foto + texto: "ó, esse pó tá insuportável, não dá pra deixar o carro na rua"
- Voz classifica: complaint, urgência média, ar/poeira, Centro
- Pulsar detecta: 8ª queixa de poeira no Centro essa semana (+40% vs base)
- Vigia gera alerta no dashboard: "ATENÇÃO Centro - poeira escalando"
```

### Cidadãos pré-populados (seed)
- Maria Aparecida (Mariana, Santo Antônio, dona de casa)
- João Pedro Silva (Mariana, Centro, padeiro)
- Ana Lúcia Ferreira (Mariana, Cabanas, professora)
- Carlos Eduardo Souza (Mariana, Santa Cruz, mineiro aposentado)
- Beatriz Oliveira (Mariana, Cabanas, estudante)

---

## Design Tokens (manter consistência entre app e dashboard)

```css
/* Cores */
--brand-green: #047857;        /* JAZIDA primary */
--brand-green-light: #10B981;
--brand-bg: #F9FAFB;
--text-primary: #111827;
--text-secondary: #6B7280;
--accent-gold: #D4A017;        /* destaque ESG */
--accent-red: #DC2626;          /* alertas */
--accent-amber: #F59E0B;        /* warnings */

/* Tipografia */
--font-display: 'Georgia', serif;       /* JAZIDA brand */
--font-body: 'Inter', system-ui;        /* tudo o resto */
```

App do Cidadão = mobile-first, fontes grandes (16-18px body), botões grandes (min 48px), linguagem coloquial brasileira ("Bora?", "Manda ver", "Tô aqui").

Dashboard da Mineradora = desktop-first, executive-grade, dados densos, fontes menores (14px body), tom corporativo PT-BR.

---

## Regras inegociáveis pra qualquer prompt

1. **Não invente endpoints** que não estão neste contrato. Se precisar de um novo, pare e pergunte.
2. **Use os tipos** de `/src/types/index.ts`. Não duplique.
3. **Não use banco real** (Supabase, Postgres, etc). In-memory + JSON file só.
4. **Não otimize prematuramente** — funcionar > elegância. É hackathon.
5. **Português** em UI/strings/comments. Variáveis e funções em inglês.
6. **Mock onde precisar** — chamar Bedrock real é OK, mas tenha fallback mockado pra demo não quebrar.
7. **Tudo deployável no Replit** ou Vercel. Sem Docker, sem infra complexa.
