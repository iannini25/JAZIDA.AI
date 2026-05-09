# CLAUDE.md — JAZIDA.AI (Hackathon Canastra)

## Sobre
Projeto **JAZIDA.AI**, desenvolvido durante o Hackathon Canastra.
Stack, escopo e arquitetura serão preenchidos quando o usuário fornecer o contexto detalhado.

## Diretórios
- **Local:** `C:\Users\berna\Desktop\Hacakthon-Canastra`
- **Remoto:** https://github.com/iannini25/JAZIDA.AI.git
- **Branch principal:** `main`

---

## REGRA CRÍTICA — Sync automático com o GitHub

> **Esta pasta deve estar 100% alinhada com `https://github.com/iannini25/JAZIDA.AI.git` o tempo todo.**

Toda alteração feita aqui (criar arquivo, editar código, deletar, renomear, etc.) **DEVE** ser commitada e enviada para o repositório remoto **automaticamente**, sem que o usuário precise pedir.

### Fluxo obrigatório após qualquer mudança no código

Ao final de qualquer tarefa que modifique arquivos do projeto, executar:

```bash
git add -A
git commit -m "<mensagem descritiva do que mudou>"
git push origin main
```

- Use mensagens de commit **descritivas** (em português, breve, modo imperativo: `add`, `update`, `fix`, `remove`).
- **Nunca** acumular várias tarefas independentes em um único commit — um commit por unidade lógica de trabalho.
- **Nunca** usar `--no-verify` ou pular hooks.
- **Nunca** fazer `force push` na `main`.
- Se o `push` falhar (ex.: divergência com o remoto), fazer `git pull --rebase origin main` e tentar de novo. Se houver conflito, resolver e avisar o usuário.

### Reforço automático via Git hook

Existe um hook `post-commit` em [.githooks/post-commit](./.githooks/post-commit) que executa `git push origin main` automaticamente após cada commit. O repo está configurado com `core.hooksPath=.githooks`, então o push vai sair sozinho mesmo se eu esquecer de chamar `git push` manualmente.

> Se o hook falhar (rede caiu, credenciais expiradas, etc.), avisar o usuário **explicitamente** — não deixar passar em silêncio.

### O que NÃO commitar
Ver [.gitignore](./.gitignore). Nunca commitar:
- `node_modules/`, `.next/`, `dist/`, `build/`, etc.
- `.env`, `.env.local`, qualquer arquivo com segredos.
- Arquivos de configuração de IDE (`.vscode/`, `.idea/`).

### Identidade do autor
Commits saem como **Bernardo Iannini** (config global do Git já configurada).

---

## Comandos rápidos

```bash
# Status
git status

# Ver o que vai ser commitado
git diff --staged

# Sincronizar manualmente (caso precise)
git pull --rebase origin main
git push origin main
```
