# JAZIDA AI -- Design System & Inventario Completo de UI

> Documento gerado a partir de analise estatica de todo o codigo-fonte do projeto.
> Objetivo: permitir reconstruir 100% do sistema visual a partir deste arquivo.

---

## 1. Stack de UI

| Camada         | Tecnologia                      | Versao   |
|----------------|---------------------------------|----------|
| Framework      | Next.js (App Router)            | 14.2.18  |
| Linguagem      | TypeScript                      | 5.6      |
| Estilo         | Tailwind CSS                    | 3.4      |
| Animacoes      | Framer Motion                   | 12.38    |
| Icones         | Emojis nativos + SVGs inline    | --       |
| Charts         | Recharts (instalado)            | 3.8      |
| Markdown       | react-markdown                  | 10.1     |
| Utilitarios    | clsx + tailwind-merge (via `cn`)| --       |
| Datas          | date-fns + locale ptBR          | 4.1      |

---

## 2. Design Tokens

### 2.1 Cores

| Token                | Variavel CSS         | Hex       | Tailwind class        | Uso                           |
|----------------------|----------------------|-----------|-----------------------|-------------------------------|
| Brand Green          | `--brand-green`      | `#047857` | `text-brand-green`, `bg-brand-green`, `border-brand-green` | CTA primario, links, icones ativos |
| Brand Green Light    | `--brand-green-light`| `#10B981` | `text-brand-green-light`, `bg-brand-green-light` | Destaques suaves, badges, fundos de feedback positivo |
| Brand Background     | `--brand-bg`         | `#F9FAFB` | `bg-brand-bg`         | Fundo geral do body, cards secundarios |
| Text Primary         | `--text-primary`     | `#111827` | `text-text-primary`   | Titulos, corpo principal      |
| Text Secondary       | `--text-secondary`   | `#6B7280` | `text-text-secondary` | Subtitulos, labels, hints     |
| Accent Gold          | `--accent-gold`      | `#D4A017` | `text-accent-gold`    | Destaque especial (nao usado atualmente) |
| Accent Red           | `--accent-red`       | `#DC2626` | `text-accent-red`     | Erros, alertas criticos       |
| Accent Amber         | `--accent-amber`     | `#F59E0B` | `text-accent-amber`   | Alertas warning, sentimento neutro |

#### Cores semanticas usadas inline (nao tokenizadas)

| Contexto               | Hex       | Onde                                  |
|------------------------|-----------|---------------------------------------|
| Gauge vermelho         | `#dc2626` | SentimentGauge (sentimento < -0.3)    |
| Gauge amarelo          | `#f59e0b` | SentimentGauge (sentimento -0.3..0.3) |
| Gauge verde            | `#047857` | SentimentGauge (sentimento > 0.3)     |

#### Paleta Tailwind auxiliar (nao tokenizada, usada diretamente)

| Cor Tailwind         | Uso                                          |
|----------------------|----------------------------------------------|
| `blue-100/800`       | Chip "Curso" no MatchCard                    |
| `emerald-100/800`    | Chip "Vaga" no MatchCard, status "resolvido" |
| `amber-100/800`      | Chip "Empreender", status "em analise"       |
| `red-100/800`        | Alerta critical, urgencia high               |
| `orange-100/800`     | Alerta alert                                 |
| `rose-100/200`       | Agent Acolhida (avatar)                      |
| `sky-100/200`        | Agent Bussola (avatar)                       |
| `violet-100/200`     | Agent Replica (avatar)                       |
| `indigo-100/200`     | Agent Pacto (avatar)                         |
| `gray-100/200/300`   | Fundos neutros, bordas, skeleton             |

### 2.2 Tipografia

| Papel        | Variavel CSS        | Familia tipografica              | Tailwind class   |
|--------------|---------------------|----------------------------------|------------------|
| Display      | `--font-display`    | Georgia, serif                   | `font-display`   |
| Body         | `--font-body`       | Inter, system-ui, sans-serif     | `font-body`      |
| Mono         | (nativo)            | monospace do sistema             | `font-mono`      |

#### Escala tipografica usada

| Elemento                       | Classes                                              |
|--------------------------------|------------------------------------------------------|
| Hero principal (landing/app)   | `text-4xl font-bold` + `font-display`                |
| Titulo de pagina (app)         | `text-3xl font-bold leading-tight` + `font-display`  |
| Titulo de secao (app)          | `text-2xl font-bold leading-tight` + `font-display`  |
| Subtitulo processamento        | `text-xl font-bold` + `font-display`                 |
| Titulo de pagina (dashboard)   | `text-lg font-bold`                                  |
| Titulo de quadrante            | `text-sm font-bold uppercase tracking-wider`          |
| Label de secao / kicker        | `text-sm uppercase tracking-widest`                   |
| Micro-label                    | `text-[10px] uppercase tracking-widest`               |
| Corpo                          | `text-base` ou `text-sm`                              |
| Corpo pequeno                  | `text-xs`                                             |
| Micro-texto                    | `text-[10px]` ou `text-[11px]`                        |
| Valor numerico grande          | `font-mono text-5xl font-bold tabular-nums`           |
| Valor numerico medio           | `font-mono text-2xl font-bold tabular-nums`           |
| Protocolo                      | `font-mono text-2xl font-bold`                        |

### 2.3 Espacamento & Raios de Borda

| Elemento              | Border radius     | Paddings tipicos          |
|-----------------------|-------------------|---------------------------|
| Card principal        | `rounded-2xl`     | `p-4` a `p-6`             |
| Card interno          | `rounded-xl`      | `p-3` a `p-4`             |
| Botao primario        | `rounded-2xl`     | `px-4 py-3` / `min-h-[56px]` |
| Botao secundario      | `rounded-2xl`     | `px-4 py-3` / `min-h-[52px]` |
| Chip/badge            | `rounded-full`    | `px-2 py-0.5`             |
| Input                 | `rounded-xl`      | `px-3 h-12`               |
| Select (dashboard)    | `rounded-lg`      | `px-3 h-10`               |
| Modal                 | `rounded-3xl`     | `p-6`                     |
| Quadrante dashboard   | `rounded-2xl`     | `p-5`                     |
| Tab / segmented ctrl  | `rounded-2xl` (container), `rounded-xl` (tab ativa) | `p-1` container, `px-4 py-2` tab |
| Avatar agent          | `rounded-full`    | `h-8 w-8`                 |
| Sidebar nav item      | `rounded-lg`      | `px-3 py-2`               |

### 2.4 Sombras

| Contexto            | Classe              |
|---------------------|----------------------|
| Card hover          | `shadow-md`          |
| Card base           | `shadow-sm`          |
| Modal overlay       | `shadow-2xl`         |
| Widget flutuante    | `shadow-lg`          |
| Sidebar             | nenhuma              |

### 2.5 Bordas

| Contexto                        | Classe                                      |
|---------------------------------|----------------------------------------------|
| Card padrao                     | `border border-gray-200`                     |
| Card hover                      | `border-brand-green`                         |
| Card selecionado                | `border-brand-green`                         |
| Protocolo badge                 | `border-2 border-brand-green`                |
| BigButton (idle)                | `border-2 border-brand-green/15`             |
| BigButton (hover)               | `border-brand-green`                         |
| Empty state (dashed)            | `border-2 border-dashed border-gray-200`     |
| Separador horizontal            | `border-b border-gray-100` ou `border-gray-200` |
| Input focus                     | `border-brand-green ring-2 ring-brand-green/30` |

---

## 3. Mapa de Paginas

### 3.1 Landing Page (`/`)

**Arquivo:** `src/app/page.tsx`
**Layout:** `src/app/layout.tsx` (root)
**Container:** `max-w-3xl` centralizado

| Elemento           | Tipo       | Descricao                                                |
|--------------------|------------|----------------------------------------------------------|
| Kicker             | Texto      | "JAZIDA AI" em `text-sm uppercase tracking-widest text-brand-green` |
| Headline           | H1         | "Sua voz, sua cidade, suas oportunidades." em `text-4xl font-bold` + `font-display` |
| Subtitulo          | P          | Descricao da plataforma                                  |
| Surface cards (x3) | Link cards | Grid 3 colunas: App do Cidadao, Dashboard, API           |
| Demo rapido        | Section    | Card branco com lista de links de demo                   |

**Surface Card:**
- Borda: `border-2 border-brand-green/15` -> hover: `border-brand-green shadow-md`
- Emoji grande (`text-2xl`) + titulo bold + subtitulo xs
- Min-height: `112px`

### 3.2 App do Cidadao -- Home (`/app`)

**Arquivo:** `src/app/app/page.tsx`
**Layout:** `src/app/app/layout.tsx` -- mobile-first, `max-w-md` centralizado em fundo branco

| Elemento           | Tipo           | Descricao                                              |
|--------------------|----------------|--------------------------------------------------------|
| Kicker             | P              | "JAZIDA . Mariana, MG" em brand-green uppercase        |
| Headline           | H1             | "Sua voz, sua cidade, suas oportunidades." font-display 3xl |
| Saudacao           | P (condicional)| "E ai, {nome}! To aqui contigo." quando logado         |
| BigButton x3       | Link           | Talento / Voz / Historia                               |
| Rodape info        | P              | Texto explicativo em `bg-brand-bg rounded-2xl p-4 text-xs` |

**BigButton:**
- Layout: flex row, emoji 3xl + titulo lg bold + subtitulo sm + seta "→" em brand-green
- Borda: `border-2 border-brand-green/15` -> hover: `border-brand-green shadow-md`
- Min-height: `80px`, `rounded-2xl`

**Emojis usados:**
- 🎯 Tenho um talento
- 📢 Quero reclamar / sugerir
- 📋 Ver minha historia
- 🌱 Boot splash (carregando)

### 3.3 Onboarding Modal

**Arquivo:** `src/app/app/page.tsx` (componente `OnboardingModal`)
**Trigger:** Primeira visita (sem `jazida_citizen_id` no localStorage)

| Elemento         | Tipo     | Descricao                                                   |
|------------------|----------|-------------------------------------------------------------|
| Overlay          | div      | `fixed inset-0 bg-black/40`, alinhado bottom em mobile      |
| Modal            | div      | `rounded-3xl bg-white p-6 shadow-2xl max-w-md`              |
| Kicker           | P        | "Bem-vindo ao JAZIDA" em brand-green uppercase               |
| Titulo           | H3       | "Como posso te chamar?" em font-display xl bold              |
| Subtitulo        | P        | "So pra eu te tratar pelo nome. Sem cadastro, sem CPF."     |
| Input nome       | input    | Label "Seu nome", placeholder "ex: Maria", `h-12 rounded-xl` |
| Input bairro     | input    | Label "Seu bairro (opcional)", placeholder "ex: Centro"       |
| Erro             | P        | Texto em `text-accent-red text-sm`                           |
| Botao submit     | button   | "Bora!" ou "Salvando...", `min-h-[56px] rounded-2xl bg-brand-green text-white` |

**Animacao:** spring (stiffness 220, damping 22), slide-up

### 3.4 Talento (`/app/talento`)

**Arquivo:** `src/app/app/talento/page.tsx`
**4 estados:** form -> processing -> matches -> error

#### Estado: Form
| Elemento         | Tipo     | Descricao                                             |
|------------------|----------|-------------------------------------------------------|
| AppHeader        | header   | Logo + "Talento" + botao voltar                       |
| Kicker           | P        | "Bora, {nome}!" em brand-green uppercase              |
| Titulo           | H1       | "O que voce faz de melhor? / O que quer aprender?" font-display 2xl |
| Subtitulo        | P        | Incentivo em text-sm secondary                        |
| Textarea         | textarea | 6 rows, `rounded-2xl`, placeholder com exemplos       |
| Botao voz (off)  | button   | "🎤 Por voz" desabilitado, borda gray                  |
| Botao enviar     | button   | "✏️ Mandar" em `bg-brand-green rounded-2xl min-h-[56px]` |
| Link voltar      | Link     | "voltar pra inicio" underline secundario               |

#### Estado: Processing
| Elemento         | Tipo       | Descricao                                          |
|------------------|------------|-----------------------------------------------------|
| Kicker           | P          | "JAZIDA ta pensando" xs brand-green                 |
| Titulo           | H2         | "So um instante..." font-display xl                 |
| Blockquote       | blockquote | Texto do usuario em italico, `bg-brand-bg rounded-2xl p-4` |
| AgentCascade     | componente | 3 steps animados (Acolhida -> Talento -> Bussola)   |

#### Estado: Matches
| Elemento         | Tipo       | Descricao                                           |
|------------------|------------|------------------------------------------------------|
| Kicker           | P          | "Bussola achou N caminhos" xs brand-green             |
| Titulo           | H2         | "Olha so, {nome}." font-display xl                    |
| Subtitulo        | P          | Cruzamento do texto com programas reais               |
| MatchCard (xN)   | componente | Cards de curso/vaga/empreender                        |
| Feedback select  | div        | Confirmacao de interesse, `border-2 border-brand-green bg-brand-green-light/10` |
| Botao historia   | button     | "Ver minha historia" outlined brand-green `min-h-[52px]` |
| Link restart     | button     | "mandar outro talento" text underline                  |

#### Estado: Error
| Elemento         | Tipo    | Descricao                                            |
|------------------|---------|-------------------------------------------------------|
| Emoji            | span    | 🤔 em text-4xl                                        |
| Mensagem         | P       | Texto do erro                                         |
| Botao retry      | button  | "Tentar de novo" `bg-brand-green rounded-2xl`          |

### 3.5 Voz (`/app/voz`)

**Arquivo:** `src/app/app/voz/page.tsx`
**4 estados:** form -> processing -> result -> error

#### Estado: Form
| Elemento            | Tipo    | Descricao                                           |
|---------------------|---------|------------------------------------------------------|
| AppHeader           | header  | Logo + "Voz" + botao voltar                          |
| Kicker              | P       | "{nome}, manda ver" brand-green uppercase             |
| Titulo              | H1      | "O que ta ruim? / Como pode melhorar?" font-display 2xl |
| Subtitulo           | P       | Explicacao sobre sinal ESG                            |
| Segmented control   | div     | 2 tabs: "📢 Reclamar" / "💡 Sugerir" em `bg-brand-bg rounded-2xl p-1` |
| Textarea            | textarea| 6 rows, placeholder dinamico por modo                  |
| Botao foto (off)    | button  | "📷 Foto" desabilitado                                 |
| Botao audio (off)   | button  | "🎤 Audio" desabilitado                                |
| Botao enviar        | button  | "Enviar" full-width `bg-brand-green min-h-[56px]`      |
| Link voltar         | Link    | "voltar pra inicio"                                     |

#### Estado: Result
| Elemento            | Tipo       | Descricao                                        |
|---------------------|------------|---------------------------------------------------|
| Kicker              | P          | "Recebido" xs brand-green                         |
| Titulo              | H2         | "A gente ja ta olhando, {nome}." font-display xl  |
| Subtitulo           | P          | Aviso que sera notificado                          |
| ProtocolBadge       | componente | Badge com numero JZD-YYYY-XXXXX em font-mono 2xl  |
| Classificacao       | div        | Card com chips: categoria, bairro, urgencia, impacto |
| Botao historia      | button     | "Ver minha historia" `bg-brand-green min-h-[52px]`  |
| Link mandar mais    | button     | "mandar mais um" text underline                     |

**Chips de classificacao:**
| Tipo         | Estilo                                         |
|--------------|-------------------------------------------------|
| Categoria    | `bg-brand-green-light/15 text-brand-green`      |
| Bairro       | `bg-gray-100 text-text-primary`                 |
| Urgencia high| `bg-red-100 text-red-800`                       |
| Urgencia med | `bg-amber-100 text-amber-800`                   |
| Urgencia low | `bg-gray-100 text-text-primary`                 |
| Impacto      | `bg-gray-100 text-text-primary`                 |

### 3.6 Historia (`/app/historia`)

**Arquivo:** `src/app/app/historia/page.tsx`

| Elemento         | Tipo       | Descricao                                           |
|------------------|------------|------------------------------------------------------|
| AppHeader        | header     | Logo + "Sua historia" + botao voltar                  |
| Kicker           | P          | "Linha do tempo" brand-green uppercase                |
| Titulo           | H1         | "E ai, {nome}." font-display 2xl                     |
| Subtitulo        | P          | Explicacao                                            |
| Skeleton loading | div (x3)   | `h-24 animate-pulse rounded-2xl bg-gray-100`          |
| Error state      | div        | `border-red-200 bg-red-50 text-red-800 rounded-2xl`   |
| Empty state      | div        | 🌱 + "Tua historia comeca agora" `border-2 border-dashed` |
| Timeline entries | componente | Lista de TimelineEntry                                 |
| Botao adicionar  | Link       | "Quero adicionar mais coisas" outlined brand-green     |

### 3.7 Dashboard Overview (`/dashboard`)

**Arquivo:** `src/app/dashboard/page.tsx`
**Layout:** `src/app/dashboard/layout.tsx` -- desktop-first, sidebar + area principal

| Elemento               | Tipo       | Descricao                                      |
|------------------------|------------|--------------------------------------------------|
| DashboardSidebar       | aside      | Navegacao lateral fixa (hidden em mobile)         |
| DashboardHeader        | header     | Top bar: mineradora + cidade + sentimento + relogio |
| Stats (right slot)     | div        | 3 stat pills: cidadaos, sinais, alertas           |
| Grid 4 quadrantes      | div        | `grid xl:grid-cols-12` com gap-4                   |
| Quadrante Sentimento   | section    | Gauge + bairros + top temas (`xl:col-span-5`)     |
| Quadrante Alertas      | section    | Lista de AlertsPanel (`xl:col-span-7`)             |
| Quadrante Agents       | section    | AgentLiveFeed + SSE (`xl:col-span-5`)              |
| Quadrante ESG          | section    | Preview do report CSRD (`xl:col-span-7`)           |
| Demo link              | div        | "?demo=live" ativa triggers                        |

**Quadrante (componente `Quadrant`):**
- `rounded-2xl border border-gray-200 bg-white p-5 shadow-sm`
- Header: titulo em `text-sm font-bold uppercase tracking-wider` + subtitulo xs + rightAction

### 3.8 Dashboard Cidadaos (`/dashboard/citizens`)

**Arquivo:** `src/app/dashboard/citizens/page.tsx`

| Elemento                | Tipo       | Descricao                                      |
|-------------------------|------------|--------------------------------------------------|
| Header                  | header     | "Cidadaos . N", kicker "Base anonimizada"         |
| Filtro                  | input      | `h-9 w-72 rounded-lg`, placeholder "filtrar nome..." |
| Botao batch             | button     | "Aprovar respostas pendentes" `bg-brand-green`     |
| Tabela cidadaos         | section    | Grid 5 colunas com CitizenRow                      |
| Header da tabela        | div        | Labels: nome/ocupacao, bairro, tal, vz, criado     |
| CitizenRow              | button     | Linha clicavel com destaque quando ativa            |
| Drawer lateral          | aside      | `w-[420px]` com detalhe do cidadao + timeline       |
| Drawer header           | header     | Nome + ocupacao + bairro + botao fechar (✕)         |
| Drawer stats            | div        | Grid 3 colunas: talentos, vozes, desde              |
| Drawer timeline         | div        | Lista de TimelineRow compactas                      |

**Drawer animacao:** slide-in da direita (x: 24 -> 0), Framer Motion

### 3.9 ESG Report (`/dashboard/esg-report`)

**Arquivo:** `src/app/dashboard/esg-report/page.tsx`

| Elemento               | Tipo       | Descricao                                        |
|------------------------|------------|---------------------------------------------------|
| Header                 | header     | "ESG Reporting" kicker + "Relatorio ESG completo"  |
| Filtros                | section    | Grid 4 cols: Framework, Cidade, Periodo + Botao gerar |
| Select (x3)            | select     | `h-10 rounded-lg`, labels uppercase               |
| Botao gerar            | button     | "Gerar rascunho" `bg-brand-green rounded-lg`       |
| Error                  | div        | `border-red-200 bg-red-50 text-red-800 rounded-lg` |
| Report header          | header     | Framework + cidade + periodo + fragmentos + data    |
| Botao exportar JSON    | button     | Outlined, `border-gray-200 rounded-md`              |
| Botao exportar PDF     | button     | `bg-brand-green rounded-md`                         |
| ESGReportPreview       | componente | Fragmentos renderizados com fonte serif              |
| Empty state            | P          | Instrucoes centralizadas em border dashed            |

### 3.10 Alocacao ESG (`/dashboard/alocacao`)

**Arquivo:** `src/app/dashboard/alocacao/page.tsx`

| Elemento               | Tipo       | Descricao                                        |
|------------------------|------------|---------------------------------------------------|
| Header                 | header     | "Alocacao ESG" kicker + "Orcamento sugerido..."    |
| Painel controles       | section    | Grid 3 cols: orcamento (input number), aderencia, cidadaos |
| Tabela sugestoes       | section    | Grid 5 cols: linha, %, R$, justificativa, acoes    |
| Input % editavel       | input      | `h-8 w-14 rounded-md font-mono text-xs`            |
| Valor R$               | span       | `font-mono tabular-nums`                           |
| Botao aprovar          | button     | "Aprovar" `bg-brand-green rounded-md text-[11px]`   |
| Rodape total           | div        | Total alocado + Exportar JSON                       |
| Stat aderencia         | div        | % com cor condicional (verde >= 85, amarelo < 85)   |

---

## 4. Componentes Reutilizaveis

### 4.1 App do Cidadao

#### `AppHeader`
**Arquivo:** `src/components/citizen/AppHeader.tsx`
- Header sticky (`sticky top-0 z-10`) com backdrop blur
- Logo SVG inline (casa estilizada, stroke) + texto "JAZIDA" em font-display bold brand-green
- Botao voltar: icone ArrowLeft SVG, `h-10 w-10 rounded-full hover:bg-gray-100`
- Titulo opcional alinhado a direita em font-semibold text-secondary

#### `AgentCascade`
**Arquivo:** `src/components/citizen/AgentCascade.tsx`
- Lista vertical animada de steps de agents processando
- 3 estados por step: pending (dot cinza), running (spinner), done (checkmark verde)
- Animacao: Framer Motion fade-in + slide-up por step
- Labels mapeados: Acolhida="ouvindo", Talento="entendendo", Voz="classificando", etc.
- **StatusDot done:** circulo `h-7 w-7 bg-brand-green rounded-full` + SVG checkmark branco
- **StatusDot running:** spinner `animate-spin border-2 border-brand-green border-t-transparent`
- **StatusDot pending:** circulo `h-3 w-3 bg-gray-300 rounded-full`

#### `MatchCard`
**Arquivo:** `src/components/citizen/MatchCard.tsx`
- Card clicavel para cada match da Bussola
- 3 tipos visuais:
  - **course:** emoji 📚, chip `bg-blue-100 text-blue-800`, label "Curso"
  - **job:** emoji 💼, chip `bg-emerald-100 text-emerald-800`, label "Vaga"
  - **entrepreneurship:** emoji 🚀, chip `bg-amber-100 text-amber-800`, label "Empreender"
- Exibe: chip tipo + fitScore % + titulo bold + descricao + duracao/custo opcionais
- Meta chips: ⏱️ duracao, 💰 custo em `bg-gray-100 rounded-md px-2 py-1`
- CTA: "Quero esse caminho" ou "Selecionado ✓"
  - Idle: `bg-brand-bg text-brand-green` -> hover: `bg-brand-green text-white`
  - Selected: `bg-brand-green text-white`
- Animacao: fade-in + slide-up com delay sequencial (0.12s * index)

#### `ProtocolBadge`
**Arquivo:** `src/components/citizen/ProtocolBadge.tsx`
- Badge centralizado com numero de protocolo
- `border-2 border-brand-green rounded-2xl bg-white px-6 py-4 shadow-sm`
- Label "Seu protocolo" em xs uppercase tracking-wider secondary
- Numero em `font-mono text-2xl font-bold text-brand-green`
- Dica "guarda isso, viu? e a tua prova" em xs secondary
- Animacao: spring scale (0.9 -> 1)

#### `TimelineEntry`
**Arquivo:** `src/components/citizen/TimelineEntry.tsx`
- 3 variantes por `kind`:

| Kind       | Icone | Fundo                                    | Conteudo                                    |
|------------|-------|------------------------------------------|---------------------------------------------|
| talent     | 🎯    | `border-gray-200 bg-white rounded-2xl`   | rawInput + label/categoria + matches (se houver) |
| complaint  | 📢/💡 | `border-gray-200 bg-white rounded-2xl`   | rawInput + chips status + protocolo + resposta |
| replica    | 💬    | `border-brand-green-light bg-brand-green-light/10 rounded-2xl` | Mensagem da Vale |

**Status chips de complaint:**
- open: "🟡 em analise" `bg-amber-100 text-amber-800`
- in_progress: "🔵 em andamento" `bg-blue-100 text-blue-800`
- resolved: "🟢 resolvido" `bg-emerald-100 text-emerald-800`

### 4.2 Dashboard

#### `DashboardHeader`
**Arquivo:** `src/components/dashboard/DashboardHeader.tsx`
- Top bar full-width: `border-b border-gray-200 bg-white px-6 py-4`
- Kicker: "JAZIDA . {miner}" em `text-[10px] uppercase tracking-widest`
- Titulo: cidade em `text-lg font-bold`
- Sentimento: valor numerico em `font-mono text-2xl font-bold tabular-nums` com cor dinamica + seta trend
- Relogio: horario atualizado a cada 30s em font-mono
- Separadores: `border-l border-gray-200 px-6` entre blocos
- Slot direito para conteudo customizado

#### `DashboardSidebar`
**Arquivo:** `src/components/dashboard/DashboardSidebar.tsx`
- `hidden md:flex w-56 border-r border-gray-200 bg-white px-4 py-6`
- Logo "JAZIDA" em Georgia serif verde + badge "dashboard" em `bg-gray-100 text-[10px]`
- 4 itens de navegacao com icones Unicode:
  - ▦ Overview (`/dashboard`)
  - ◯ Cidadaos (`/dashboard/citizens`)
  - ▤ ESG Report (`/dashboard/esg-report`)
  - ▢ Alocacao (`/dashboard/alocacao`)
- Item ativo: `bg-brand-green/10 font-semibold text-brand-green`
- Item inativo: `text-text-primary hover:bg-gray-100`
- Rodape: info box em `bg-brand-bg rounded-lg p-3 text-[11px]`

#### `SentimentGauge`
**Arquivo:** `src/components/dashboard/SentimentGauge.tsx`
- Gauge semicircular em SVG puro
- Track: arco de fundo `#e5e7eb`, strokeWidth 16
- Zonas coloridas com opacity 0.18: vermelho / amarelo / verde
- Arco preenchido ate o valor com cor dinamica
- Ponta: circulo duplo (cor + branco)
- Labels "-1" e "+1" nas extremidades
- Valor numerico: `font-mono text-5xl font-bold tabular-nums`
- Trend: "↑ subindo" (emerald) / "↓ caindo" (red) / "→ estavel" (gray)
- Tamanho default: 240px

#### `NeighborhoodBars`
**Arquivo:** `src/components/dashboard/NeighborhoodBars.tsx`
- Lista com mini-barras horizontais por bairro
- Grid: `grid-cols-[110px_1fr_60px]`
- Barra centralizada em 50%: positivo cresce a direita, negativo a esquerda
- Cores: `bg-emerald-600` (> 0.3), `bg-red-600` (< -0.3), `bg-amber-500` (neutro)
- Linha central: `w-px bg-gray-300`

#### `AlertsPanel`
**Arquivo:** `src/components/dashboard/AlertsPanel.tsx`
- Lista animada (Framer Motion) de alertas com 3 niveis:

| Nivel    | Pill class                     | Card class                       |
|----------|--------------------------------|----------------------------------|
| warning  | `bg-amber-100 text-amber-800`  | `border-amber-200 bg-amber-50/50`|
| alert    | `bg-orange-100 text-orange-800`| `border-orange-200 bg-orange-50/40`|
| critical | `bg-red-100 text-red-800`      | `border-red-200 bg-red-50/40`    |

- Cada alerta: pill de nivel + tempo relativo + titulo bold + descricao + acao recomendada
- Botao dismiss (✕) opcional
- Empty state: "Sem alertas ativos. Tudo sob controle." em border dashed

#### `AgentLiveFeed`
**Arquivo:** `src/components/dashboard/AgentLiveFeed.tsx`
- Feed cronologico inverso conectado via SSE
- Header: "Agents ao vivo" + dot de conexao (verde pulsante / cinza offline)
- Cada evento: avatar colorido por agent + nome + acao + tempo relativo

| Agent     | Avatar bg       | Avatar ring       | Inicial |
|-----------|-----------------|-------------------|---------|
| Acolhida  | `bg-rose-100`   | `ring-rose-200`   | A       |
| Talento   | `bg-emerald-100`| `ring-emerald-200`| T       |
| Voz       | `bg-orange-100` | `ring-orange-200` | V       |
| Bussola   | `bg-sky-100`    | `ring-sky-200`    | B       |
| Replica   | `bg-violet-100` | `ring-violet-200` | R       |
| Pulsar    | `bg-amber-100`  | `ring-amber-200`  | P       |
| Pacto     | `bg-indigo-100` | `ring-indigo-200` | P       |

- Animacao: layout + fade-in + slide-down
- Empty: "Aguardando eventos..." em border dashed

#### `ESGReportPreview`
**Arquivo:** `src/components/dashboard/ESGReportPreview.tsx`
- Renderiza fragmentos ESG com fonte serif (`Georgia, serif`)
- Header do fragmento: framework + secao + "JAZIDA . Mariana" em `text-[10px] uppercase tracking-widest`
- Corpo: ReactMarkdown, `text-sm leading-relaxed`
- Evidencias: lista de pills em `bg-brand-bg font-mono text-[10px]`
- Empty: mensagem em border dashed

#### `DemoTriggerWidget`
**Arquivo:** `src/components/dashboard/DemoTriggerWidget.tsx`
- Widget flutuante: `fixed bottom-4 right-4 z-30 w-[280px] rounded-xl border bg-white shadow-lg`
- Kicker: "Live demo" em brand-green + "?demo=live" em mono
- 3 botoes:
  - "▶ Maria pede enfermagem" -- `bg-brand-green text-white`
  - "▶ Joao reclama de poeira" -- `bg-brand-green text-white`
  - "↺ Repopular DB" -- style sutil, `text-text-secondary hover:bg-gray-100`
- Feedback: resultado em `bg-brand-bg rounded-md p-2 text-[11px]`

#### `CitizenRow`
**Arquivo:** `src/components/dashboard/CitizenRow.tsx`
- Linha de tabela clicavel
- Grid: `grid-cols-[1.2fr_1fr_60px_60px_70px]`
- Ativo: `border-brand-green bg-brand-green/5`
- Hover: `bg-gray-50`
- Contadores: `font-mono tabular-nums` + label "tal"/"vz" em `text-[10px]`

---

## 5. Icones & Emojis

### 5.1 SVGs Inline (Componentes)

| Icone         | Arquivo/Componente     | Descricao                              |
|---------------|------------------------|----------------------------------------|
| ArrowLeft     | AppHeader.tsx          | Seta voltar, stroke 2.4, 22x22        |
| Logo (casa)   | AppHeader.tsx          | Casa estilizada, stroke 2.2, 22x22    |
| Checkmark     | AgentCascade.tsx       | Polyline check, stroke 3, 18x18       |

### 5.2 Unicode / Caracteres

| Simbolo | Uso                       |
|---------|---------------------------|
| ▦       | Sidebar: Overview         |
| ◯       | Sidebar: Cidadaos         |
| ▤       | Sidebar: ESG Report       |
| ▢       | Sidebar: Alocacao         |
| →       | BigButton seta, links nav |
| ↑ ↓ →   | Trend sentiment           |
| ✕       | Botao fechar/dismiss      |

### 5.3 Emojis

| Emoji | Contexto                              |
|-------|---------------------------------------|
| 📱    | Landing: App do Cidadao               |
| 📊    | Landing: Dashboard                    |
| 🛠️    | Landing: API                          |
| 🎯    | BigButton Talento / Timeline talent   |
| 📢    | BigButton Voz / Timeline queixa       |
| 📋    | BigButton Historia                    |
| 🌱    | Boot splash / Empty state historia    |
| ✏️    | Botao "Mandar" (talento)              |
| 🎤    | Botao voz (desabilitado)              |
| 📷    | Botao foto (desabilitado)             |
| 💡    | Sugestao (tab + timeline)             |
| 🤔    | Tela de erro                          |
| 📚    | MatchCard tipo course                 |
| 💼    | MatchCard tipo job                    |
| 🚀    | MatchCard tipo entrepreneurship       |
| ⏱️    | Chip duracao                          |
| 💰    | Chip custo                            |
| 💬    | Timeline replica                      |
| 🟡    | Status open                           |
| 🔵    | Status in_progress                    |
| 🟢    | Status resolved                       |

---

## 6. Estados de UI

### 6.1 Loading

| Contexto            | Implementacao                                             |
|---------------------|-----------------------------------------------------------|
| Boot splash (app)   | 🌱 + "carregando seu canal..." font-mono xs centralizado  |
| Skeleton (historia) | 3x `h-24 animate-pulse rounded-2xl bg-gray-100`           |
| Texto simples       | "carregando..." em text-sm text-secondary                  |
| Botao loading       | Texto muda para "Salvando..." / "gerando..." / "..."       |

### 6.2 Empty States

| Contexto                | Visual                                                     |
|-------------------------|-------------------------------------------------------------|
| Historia vazia          | 🌱 + titulo "Tua historia comeca agora" + subtitulo, border dashed |
| Sem alertas             | "Sem alertas ativos. Tudo sob controle." border dashed       |
| Sem bairros             | "Sem sinais por bairro ainda." text-xs                       |
| Sem eventos agent       | "Aguardando eventos..." border dashed                        |
| ESG sem rascunho        | "Nenhum rascunho gerado ainda." border dashed                |
| ESG report nao gerado   | Instrucoes "Selecione framework..." border dashed            |
| Tabela sem filtro        | "nenhum cidadao no filtro." text-sm                          |

### 6.3 Error States

| Contexto              | Visual                                                      |
|-----------------------|--------------------------------------------------------------|
| Erro generico (app)   | 🤔 + mensagem + botao "Tentar de novo" bg-brand-green        |
| Erro historia         | Card `border-red-200 bg-red-50 text-red-800 rounded-2xl`     |
| Erro onboarding       | Texto `text-accent-red text-sm` inline                        |
| Erro ESG report       | Card `border-red-200 bg-red-50 text-red-800 rounded-lg`      |

---

## 7. Animacoes (Framer Motion)

| Componente / Contexto         | Tipo                | Parametros                           |
|-------------------------------|---------------------|--------------------------------------|
| OnboardingModal overlay       | fade-in/out         | opacity 0 -> 1                       |
| OnboardingModal card          | slide-up + spring   | y: 40->0, stiffness 220, damping 22  |
| ProtocolBadge                 | scale-in + spring   | scale 0.9->1, stiffness 220, damping 18 |
| AgentCascade step             | fade-in + slide-up  | opacity 0->1, y 8->0, duration 0.3   |
| MatchCard                     | fade-in + slide-up  | opacity 0->1, y 12->0, delay sequencial 0.12s |
| MatchesView header            | fade-in + slide-up  | opacity 0->1, y 10->0                |
| Feedback de selecao           | fade-in + slide-up  | opacity 0->1, y 8->0                 |
| AlertsPanel items             | layout + slide-in   | opacity/x -8->0, duration 0.25       |
| AgentLiveFeed items           | layout + slide-down | opacity/y -10->0, duration 0.25      |
| Citizen drawer                | slide-in-right      | opacity/x 24->0, duration 0.2        |
| DemoTriggerWidget             | fade-in + slide-up  | opacity 0->1, y 16->0                |
| ESG report section            | fade-in + slide-up  | opacity 0->1, y 8->0                 |
| Alocacao rows                 | layout              | Framer layout animation               |
| Dashboard hint (demo link)    | fade-in             | opacity 0->1                          |

---

## 8. Layouts & Responsividade

### 8.1 Root Layout (`/`)
- `max-w-3xl mx-auto px-6 py-12`
- Grid: `sm:grid-cols-3` para Surface cards

### 8.2 App do Cidadao (`/app/*`)
- Container: `max-w-md mx-auto min-h-screen bg-white shadow-sm`
- Mobile-first, sem breakpoints adicionais
- Padding: `px-5 py-6 pb-24` (24 de padding bottom pro conteudo nao ficar cortado)

### 8.3 Dashboard (`/dashboard/*`)
- `flex min-h-screen w-full`
- Sidebar: `hidden md:flex w-56` (some em mobile)
- Area principal: `flex-1 min-w-0`
- Grid de quadrantes: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-12`
- Max content: `max-w-[1600px] mx-auto`
- ESG / Alocacao max: `max-w-[1400px] mx-auto`

### 8.4 Breakpoints utilizados

| Breakpoint | Uso                                                  |
|------------|------------------------------------------------------|
| `sm:`      | Landing grid 3 cols, ESG filtros 2 cols              |
| `md:`      | Sidebar visivel, gauge 2 cols                        |
| `lg:`      | Dashboard grid 2 cols, drawer cidadao visivel, ESG 4 cols |
| `xl:`      | Dashboard grid 12 cols                               |

---

## 9. Interacoes & Comportamentos

### 9.1 Hover States
- Cards/botoes: `hover:border-brand-green hover:shadow-md`
- Links internos: `hover:underline` ou `hover:bg-gray-100`
- Sidebar items: `hover:bg-gray-100`
- Botao ativo: `active:scale-[0.98]` (so no botao "Mandar")

### 9.2 Focus States (Inputs)
- `focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30`

### 9.3 Disabled States
- `disabled:opacity-50`
- Botoes futuros (voz/foto): `opacity-60` fixo

### 9.4 Polling / Tempo Real
- Dashboard overview: polling a cada 10s para sentimento, alertas e cidadaos
- AgentLiveFeed: SSE (EventSource) + snapshot inicial via REST
- Heartbeat: pulso visual no dot de conexao (ring-4 ring-brand-green/30)
- Relogio no header: atualiza a cada 30s

### 9.5 Persistencia Client-Side
- localStorage keys: `jazida_citizen_id`, `jazida_citizen_name`
- Usado para identificar cidadao entre sessoes no app mobile

---

## 10. Patterns de Codigo de UI

### 10.1 `cn()` utility
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### 10.2 Pattern de pagina (view states)
```
type ViewState = "form" | "processing" | "result" | "error";
// Renderiza condicionalmente por estado
{view === "form" && <FormView />}
{view === "processing" && <ProcessingView />}
```

### 10.3 Pattern de kicker + titulo + subtitulo
```
<p className="text-sm uppercase tracking-wider text-brand-green">KICKER</p>
<h1 className="mt-1 text-2xl font-bold leading-tight text-text-primary"
    style={{ fontFamily: "var(--font-display)" }}>
  Titulo
</h1>
<p className="mt-2 text-sm text-text-secondary">Subtitulo</p>
```

### 10.4 Pattern de botao primario
```
<button className="flex min-h-[56px] items-center justify-center rounded-2xl bg-brand-green px-4 text-base font-semibold text-white disabled:opacity-50">
```

### 10.5 Pattern de botao outlined
```
<button className="flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-brand-green text-base font-semibold text-brand-green hover:bg-brand-green hover:text-white">
```

---

## 11. Dependencias de UI (package.json)

| Pacote              | Uso                                |
|---------------------|------------------------------------|
| framer-motion       | Animacoes e transicoes             |
| lucide-react        | Instalado mas NAO usado (emojis/SVGs inline preferidos) |
| react-markdown      | Renderizar conteudo ESG em markdown|
| recharts            | Instalado mas NAO usado atualmente |
| clsx + tailwind-merge | Utility `cn()` para classes       |
| date-fns            | Formatacao de datas (ptBR)         |

---

## 12. Endpoints da API (Referencia Rapida)

| Metodo | Rota                                    | Superficie   |
|--------|-----------------------------------------|--------------|
| GET    | `/api/citizens`                         | App          |
| POST   | `/api/citizens`                         | App          |
| GET    | `/api/citizens/[id]`                    | App          |
| GET    | `/api/citizens/[id]/history`            | App/Dashboard|
| POST   | `/api/citizens/[id]/talents`            | App          |
| GET    | `/api/citizens/[id]/talents`            | App          |
| POST   | `/api/citizens/[id]/complaints`         | App          |
| GET    | `/api/dashboard/sentiment`              | Dashboard    |
| GET    | `/api/dashboard/alerts`                 | Dashboard    |
| GET    | `/api/dashboard/agent-events`           | Dashboard    |
| GET    | `/api/dashboard/agent-events/stream`    | Dashboard (SSE) |
| GET    | `/api/dashboard/citizens`               | Dashboard    |
| POST   | `/api/dashboard/replica/approve`        | Dashboard    |
| POST   | `/api/dashboard/esg-report`             | Dashboard    |
| POST   | `/api/demo/seed`                        | Demo         |
| POST   | `/api/demo/trigger/[scenario]`          | Demo         |
