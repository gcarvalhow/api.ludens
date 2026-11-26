# API local com Vercel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Executar a API no PC e usar o frontend Vercel durante demonstrações.
**Architecture:** Compose sobe banco, Mailpit, migrations e API. Cloudflared publica apenas a API; Next.js encaminha `/api` para o túnel, mantendo autenticação no domínio do frontend.
**Tech Stack:** Docker Compose, FastAPI, PostgreSQL 16, Mailpit, cloudflared, Next.js, PowerShell.
**Spec:** `docs/superpowers/specs/2026-10-22-local-api-vercel-design.md`.

## Global Constraints

- Segredos em arquivo local ignorado, nunca exibidos nos logs do roteiro.
- PostgreSQL sem porta publicada; API e Mailpit publicados apenas em loopback.
- Túnel temporário; atualização de endereço exige republicação Vercel.
- Dados persistentes; parada normal nunca remove volumes.
- Nenhuma dependência de Azure; e-mail de teste somente em Mailpit.

## Review Focus

- Cookie Secure deve funcionar no proxy HTTPS sem exigir TLS do banco local.
- Sem API_PROXY_URL, chamadas e autenticação locais devem continuar funcionando.
- Endereço do túnel com barra final não pode duplicar `/api`.
- Falha nas migrations deve impedir inicialização da API.
- Reiniciar o ambiente deve preservar os dados e não trocar JWT existente.

### Task 1: Configuração independente do cookie seguro

**Files:** modificar `api.ludens/src/app/config.py` e `api.ludens/src/app/modules/identity/shared/cookies.py`; criar `api.ludens/tests/unit/test_refresh_cookie.py`.
**Interfaces:** `Settings.refresh_cookie_secure: bool | None = None`; None preserva o comportamento por ambiente; valor explícito substitui apenas Secure, mantendo SameSite coerente e o Path existente.

- [ ] Criar testes: development padrão tem Secure falso; development com override verdadeiro tem Secure verdadeiro; production padrão mantém Secure verdadeiro; banco development continua sem SSL exigido. Verificar HttpOnly, Path e remoção do cookie no logout.
- [ ] Executar testes e confirmar falha por ausência do override.
- [ ] Implementar campo e resolução consistente dos atributos na criação e remoção do cookie; não alterar configuração TLS do banco.
- [ ] Executar testes unitários relevantes, confirmando aprovação.

### Task 2: Backend demonstrável em Compose

**Files:** criar `api.ludens/docker/docker-compose.Demo.yml`, `api.ludens/.env.demo.example` e `api.ludens/scripts/Start-Demo.ps1`; ajustar `.gitignore` da API.
**Interfaces:** arquivo `.env.demo` na raiz da API, ignorado; `JWT_SECRET_KEY`, `FRONTEND_BASE_URL`; perfil Compose `tunnel`; serviço `api` atende porta interna 8000.

- [ ] Criar Compose com PostgreSQL 16 persistente e healthcheck pg_isready, Mailpit, serviço migrations com `alembic upgrade head`, API dependente de migrations bem-sucedidas e banco saudável; cloudflared opcional aponta para `http://api:8000`.
- [ ] Configurar ENVIRONMENT=development, REFRESH_COOKIE_SECURE=true, SMTP local e banco interno sem TLS; CORS limitado ao domínio Vercel publicado. Publicar API em 127.0.0.1:8000 e Mailpit em 127.0.0.1:8025; não publicar banco ou SMTP.
- [ ] Implementar roteiro PowerShell que verifica Docker, cria configuração ausente com JWT criptograficamente aleatório e preserva configuração existente; inicia Compose com `--profile tunnel up -d --build`; falha explicitamente se qualquer comando falhar. Não imprimir configuração secreta.
- [ ] Executar `docker compose --env-file .env.demo -f docker/docker-compose.Demo.yml config --quiet`, build e inicialização.
- [ ] Conferir `/health`, logs das migrations, URL HTTPS nos logs cloudflared e dados persistentes após reinício. Simular migrations falhando e verificar que API não inicia. Executar roteiro duas vezes e confirmar JWT preservado sem expô-lo.

### Task 3: Proxy no frontend

**Files:** modificar `web.ludens/next.config.mjs`, `web.ludens/.env.example`; criar `web.ludens/tests/api-proxy.test.mjs`.
**Interfaces:** `API_PROXY_URL` contém origem HTTPS do túnel, sem `/api`; rewrite `/api/:path*` aponta para `${origin}/api/:path*`. Neste modo NEXT_PUBLIC_API_URL fica ausente ou vazio.

- [ ] Criar testes Node que importam a configuração com ambiente isolado: URL ausente preserva comportamento; URL válida gera destino com um único `/api`; barra final é normalizada; origem inválida é rejeitada com erro explicativo.
- [ ] Executar `node --test tests/api-proxy.test.mjs` e confirmar falha antes da implementação.
- [ ] Implementar rewrite condicionado à variável, validando origem HTTP(S) e rejeitando credenciais, query, fragmento e caminhos além de `/`. Não alterar fetcher nem contratos públicos.
- [ ] Executar testes Node, Jest, lint e build do frontend.

### Task 4: Integração Vercel e operação

**Files:** criar `docs.ludens/team/local-api-vercel.md`; adicionar link nos READMEs da API e documentação.
**Interfaces:** domínio existente `https://codepenguins-web-ludens.vercel.app`; variável servidor `API_PROXY_URL` em Production na Vercel.

- [ ] Documentar Docker Desktop, execução do roteiro, leitura da URL temporária, configuração API_PROXY_URL e remoção de NEXT_PUBLIC_API_URL no modo proxy, redeploy e comandos de parada sem `-v`.
- [ ] Documentar Mailpit local, migrations, criação opcional do admin pelo script existente e diagnóstico de API/túnel desligados. Informar exposição pública da API e uso somente de dados fictícios.
- [ ] Com acesso Vercel autorizado e túnel real, configurar variável e publicar frontend; se faltar acesso, entregar instruções exatas e identificar a etapa pendente.
- [ ] Verificar domínio Vercel: health e catálogo por `/api`, cadastro, login, refresh e logout; inspecionar cookies Secure/HttpOnly e confirmar que o navegador não chama diretamente o domínio do túnel.
- [ ] Verificar `git diff --check` em todos os repositórios alterados e registrar comandos executados, resultados e qualquer bloqueio real. Commit e push somente conforme autorização vigente para estas novas alterações.
