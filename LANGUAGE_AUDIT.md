# JAZIDA AI -- Language Audit (Portugues)
**Data:** 2026-05-09
**Status:** APLICADO

## Sumario
- 87 erros de acentuacao corrigidos
- 3 nomes proprios padronizados (Ana Lucia -> Ana Lucia, Joao -> Joao, Santo Antonio -> Santo Antonio)
- 12 labels de dashboard corrigidos (alocacao, ESG report)
- 7 system prompts revisados integralmente (177 linhas)
- 45+ strings de fallback/hardcoded dos agents corrigidas (semente, replica, acolhida)
- 1 erro de mensagem de erro de auth corrigido
- Total: ~150 correcoes aplicadas em 10 arquivos

## Correcoes por arquivo

### `src/lib/agents/prompts.ts` (7 prompts, 177 linhas)
- PROMPT_ACOLHIDA: "Voce e Acolhida" -> "Voce e Acolhida" (6 acentos), "cidadao" -> "cidadao", "sugestao" -> "sugestao", "nao" -> "nao", "sensivel" -> "sensivel", "amigavel" -> "amigavel"
- PROMPT_TALENTO: "aspiracoes" -> "aspiracoes", "transcricao" -> "transcricao", "audio" -> "audio", "aspiracao" -> "aspiracao", "propria" -> "propria", "saude" -> "saude", "educacao" -> "educacao", "tecnico" -> "tecnico", "construcao" -> "construcao", "servicos" -> "servicos", "ambigua" -> "ambigua", "interpretacao" -> "interpretacao", "informacao" -> "informacao"
- PROMPT_VOZ: "sugestoes" -> "sugestoes", "sugestao" -> "sugestao", "seguranca" -> "seguranca", "saude" -> "saude", "visivel" -> "visivel", "so" -> "so", "varios" -> "varios", "explicita" -> "explicita", "operacao" -> "operacao", "detonacao" -> "detonacao", "caminhoes" -> "caminhoes", "padrao" -> "padrao"
- PROMPT_BUSSOLA: "aspiracoes" -> "aspiracoes", "cidadao" -> "cidadao", "ocupacao" -> "ocupacao", "relevancia" -> "relevancia", "especifico" -> "especifico", "aplicavel" -> "aplicavel", "fundacoes" -> "fundacoes", "Fundacao" -> "Fundacao"
- PROMPT_REPLICA: "Replica" -> "Replica", "cidadaos" -> "cidadaos", "sugestao" -> "sugestao", "acao" -> "acao", "cidadao" -> "cidadao", "Faca" -> "Faca", "referencia" -> "referencia", "Saudacao" -> "Saudacao", "Proximo" -> "Proximo", "so" -> "so"
- PROMPT_PULSAR: "analitico" -> "analitico", "sugestoes" -> "sugestoes", "mineracao" -> "mineracao", "ate" -> "ate", "medio" -> "medio", "terco" -> "terco", "nao" -> "nao"
- PROMPT_SEMENTE: "avaliacao" -> "avaliacao", "negocio" -> "negocio", "missao" -> "missao", "viavel" -> "viavel", "cidadaos" -> "cidadaos", "ocupacao" -> "ocupacao", "competicao" -> "competicao", "analise" -> "analise", "Araxa" -> "Araxa", "numeros" -> "numeros", "opcoes" -> "opcoes", "capacitacao" -> "capacitacao", "microcredito" -> "microcredito", "Credito" -> "Credito", "Fundacao" -> "Fundacao", "formalizacao" -> "formalizacao", "regulamentacao" -> "regulamentacao", "alimentacao" -> "alimentacao", "vigilancia" -> "vigilancia", "sanitaria" -> "sanitaria", "explicacao" -> "explicacao", "memoravel" -> "memoravel"
- PROMPT_PACTO: "Voce e Pacto" -> "Voce e Pacto", "padroes" -> "padroes", "metricas" -> "metricas", "cidadaos" -> "cidadaos", "sugestoes" -> "sugestoes", "resolucao" -> "resolucao", "relatorio" -> "relatorio", "Comunitario" -> "Comunitario", "Inclusao" -> "Inclusao", "numeros" -> "numeros", "so" -> "so", "periodo" -> "periodo"

### `src/lib/agents/semente.ts` (fallbacks hardcoded)
- HARDCODED_BEATRIZ: "Confeccao" -> "Confeccao", "regiao" -> "regiao", "atelie" -> "atelie", "cidadaos" -> "cidadaos", "servico necessario" -> "servico necessario", "ultimos" -> "ultimos", "Nao ha" -> "Nao ha", "servico" -> "servico", "Voce pode" -> "Voce pode", "altissima" -> "altissima", "competicao" -> "competicao", "Fundacao" -> "Fundacao", "Formalizacao" -> "Formalizacao", "financia ate" -> "financia ate", "Negocio" -> "Negocio", "mes" -> "mes", "cidadaos" -> "cidadaos", "vao" -> "vao", "Microcredito ate" -> "Microcredito ate", "recem-aberto" -> "recem-aberto", "ha 2+ anos" -> "ha 2+ anos"
- HARDCODED_PADARIA: "producao propria" -> "producao propria", "paes" -> "paes", "cidadaos" -> "cidadaos", "ultimos" -> "ultimos", "ja operam" -> "ja operam", "competicao" -> "competicao", "cenografico" -> "cenografico", "competicao" -> "competicao", "Negocio" -> "Negocio", "Especializacao" -> "Especializacao", "ate R$ 81k" -> "ate R$ 81k", "Vigilancia sanitaria" -> "Vigilancia sanitaria", "Producao" -> "Producao", "alvara" -> "alvara", "ate R$ 21.000" -> "ate R$ 21.000"
- HARDCODED_MARMITA: "Producao" -> "Producao", "cidadaos" -> "cidadaos", "alimentacao" -> "alimentacao", "refeitorios" -> "refeitorios", "propria" -> "propria", "competicao" -> "competicao", "Formalizacao" -> "Formalizacao", "alimentacao" -> "alimentacao", "refeitorios" -> "refeitorios", "Vigilancia sanitaria" -> "Vigilancia sanitaria", "Adequacao" -> "Adequacao", "padrao" -> "padrao", "mes" -> "mes", "Alimentacao" -> "Alimentacao", "Especializacao" -> "Especializacao", "producao" -> "producao", "Fundacao" -> "Fundacao", "ate R$ 5.000" -> "ate R$ 5.000", "recem-aberto" -> "recem-aberto", "ate R$ 21.000" -> "ate R$ 21.000"
- HARDCODED_GENERICO: "analise" -> "analise", "viavel" -> "viavel", "comecar" -> "comecar", "nao" -> "nao", "Formalizacao" -> "Formalizacao", "Capacitacao" -> "Capacitacao", "mes" -> "mes", "Validacao" -> "Validacao", "ja pediram" -> "ja pediram", "servico" -> "servico"

### `src/lib/agents/acolhida.ts`
- L120: "voce quer compartilhar" -> "voce quer compartilhar"

### `src/lib/agents/replica.ts` (fallback messages pro cidadao)
- L100: "voce comentou" -> "voce comentou", "pre-cadastro" -> "pre-cadastro"
- L103: "providencia sobre o que voce relatou" -> "providencia sobre o que voce relatou", "ta?" -> "ta?"
- L105: "ja esta sendo cuidada" -> "ja esta sendo cuidada"

### `src/lib/seed.ts` (nomes proprios)
- L48: "Maria Aparecida" mantido (ok)
- L54: "Santo Antonio" -> "Santo Antonio" (3 ocorrencias)
- L55: "Joao Pedro Silva" -> "Joao Pedro Silva"
- L66: "Ana Lucia Ferreira" -> "Ana Lucia Ferreira"

### `src/lib/auth.ts` (mensagens de erro + nomes)
- L35: "Usuario ja existe" -> "Usuario ja existe"
- L157: "Ana Lucia" -> "Ana Lucia"
- L155: "Joao Pedro" -> "Joao Pedro"

### `src/app/app/layout.tsx` (metadata)
- L9: "cidadao do JAZIDA" -> "cidadao do JAZIDA", "sugestao" -> "sugestao", "voce" -> "voce"

### `src/app/app/talento/page.tsx` (cascade steps)
- L40: "voce quer" -> "voce quer"
- L41: "pra voce" -> "pra voce"

### `src/app/dashboard/alocacao/page.tsx` (12 labels de categoria)
- "Mitigacao" -> "Mitigacao", "Operacoes" -> "Operacoes", "ruido" -> "ruido", "logistica" -> "logistica", "Capacitacao" -> "Capacitacao", "saude" -> "saude", "Saude publica" -> "Saude publica", "Educacao" -> "Educacao", "tecnico" -> "tecnico", "agua" -> "agua"

### `src/app/dashboard/esg-report/page.tsx`
- L34: "gerar relatorio" -> "gerar relatorio"
- L47: "Relatorio ESG completo" -> "Relatorio ESG completo"
- L127: "relatorio enviado" -> "relatorio enviado"
- L142: "periodo" -> "periodo"

### `src/app/api/demo/trigger/[scenario]/route.ts`
- L76: "Santo Antonio" -> "Santo Antonio"

## Padronizacao de nomes proprios
- "Santo Antonio" -> "Santo Antonio" (3 arquivos, 4 ocorrencias)
- "Ana Lucia Ferreira" -> "Ana Lucia Ferreira" (2 arquivos)
- "Joao Pedro Silva" -> "Joao Pedro Silva" (2 arquivos)
- "Maria Aparecida" mantido (ja correto)
- "Beatriz Oliveira" mantido (ja correto)
- "Carlos Eduardo Souza" mantido (ja correto)

## Decisoes editoriais preservadas (nao-correcoes intencionais)
- App cidadao: "Bora?", "To aqui contigo", "Manda ver", "ta?" — preservado (tom coloquial de marca)
- "pra" em contexto coloquial — preservado (app cidadao e prompts)
- "a gente" — preservado onde aparece no app cidadao
- "dashboard" — mantido em ingles (termo tecnico estabelecido)
- Valores de category/type em ingles (ex: "complaint", "suggestion") — sao identificadores de API, nao tocados
- Nomes de variaveis sem acento (ex: `cidadao`, `funcionario`) — padrao do projeto, nao tocados
- Comentarios em ingles — nao tocados

## Risk-flag final
- App cidadao: revisado, sem erros restantes em strings visiveis
- Dashboard: revisado, labels corrigidos
- System prompts: revisados integralmente (7 prompts)
- Fallbacks hardcoded: revisados (4 cenarios)
- Seed data: nomes proprios consistentes
- Auth: mensagens de erro corrigidas
