# Ludens · Plano da entrega de 27/11/2026

Entrega: software entregável, manutenções atendidas, código limpo e SonarQube aplicado.
Apresentação em 27/11/2026.

## 1. Fontes

| Fonte | O que fixa |
| --- | --- |
| Enunciado da atividade (aula de 26/11/2026, repassado por Igor) | R1–R6 e o prazo |
| Relatório da N3 (`git show 8231efe^:docs/relatorio-n3.md`), Etapa 1 | papéis de cada integrante |
| Relatório da N3, Etapas 4 e 7 | lista de manutenções (DT-01 a DT-15) |
| [`team/overview.md`](../team/overview.md) | logins do GitHub; fluxo de PR com 1 aprovação de outra pessoa (DoD) |

## 2. Requisitos

| R | Trecho literal (enunciado) | Onde é atendido |
| --- | --- | --- |
| R1 | "deixar o software entregável" | T0, T2 · D3 |
| R2 | "atendendo as manutenções" | T2, T3, T4, T5 · D2 |
| R3 | "aplicando o código limpo" | T3, T4 |
| R4 | "No dia 27 vcs vão apresentar" | T7 |
| R5 | "vão mostrar o sonar aplicado" | T1, T6, T7 |
| R6 | "Usar SonarQube" | T1 · D1 |

## 3. Decisões

| D | Decisão | Quem | Motivo | Descartado |
| --- | --- | --- | --- | --- |
| D1 | SonarQube Cloud, analisando `apps/api` e `apps/web` no GitHub Actions a cada push na `master` e a cada PR | Igor | repo público, gratuito, dashboard com link para a apresentação | SonarQube Server local |
| D2 | "Manutenções" = débitos DT-01 a DT-15 do relatório da N3, cortados pelo prazo de 1 dia (§4) | Igor | lista já medida e priorizada pela equipe | só o que o Sonar apontar |
| D3 | "Entregável" = `master` com CI verde, API e web publicadas na conta Render do Igor, com a web apontando para essa API, com a jornada de compra simulada funcionando | Igor | tudo na conta do próprio time; dá para demonstrar ao vivo em 27/11 | Vercel e Azure de outras contas; entrega só local |
| D4 | Papéis da N3: Igor DevOps, Gabriel Eng. de Requisitos, Adrian Dev Full-stack, Renato QA, Diego PO | Igor | mantidos da N3 | novo rodízio |
| D5 | Diego (PO, dev frontend na N1) também corrige os apontamentos do Sonar no frontend | agente | prazo de 1 dia; Adrian sozinho não cobre backend e frontend | Adrian nos dois |
| D6 | Renato revisa todos os PRs; o PR do Renato (T6) é revisado pelo Diego | agente | DoD exige aprovação de outra pessoa e o GitHub não deixa aprovar o próprio PR | QA aprovando o próprio PR |
| D7 | Web no Render usa `API_PROXY_URL=https://ludens-api.onrender.com` (rewrite de `apps/web/next.config.mjs`) | agente | navegador chama `/api` no mesmo domínio; o cookie de refresh não vira cookie de terceiro | `NEXT_PUBLIC_API_URL` apontando direto para o Render |

## 4. Fora do escopo

- DT-01 (ciclo `catalog`↔`booking`) e DT-02 (SQL em `application/`) — a N3 estimou cerca de 1 semana para a Fase 1; os 2 testes `xfail` continuam marcados.
- DT-03 (módulo `payment`, agregados anêmicos) — depende de DT-01/DT-02.
- DT-06 (retentativa do outbox) — mudança de schema e de comportamento sem tempo para teste de falha em 1 dia.
- DT-07 (`alembic check` no CI) — não aparece no Sonar nem na demonstração.
- DT-08 (Pix real) — integração externa; a demonstração usa o pagamento simulado.
- DT-14 (imagens `:latest` no ambiente demo local) — a demonstração usa o Render, não o túnel.
- DT-15 (`/health` com banco, limite de login) — nenhum R pede; vira issue de débito em T5.
- Meta de cobertura de testes no Quality Gate — o enunciado pede o Sonar aplicado, não um percentual.

## 5. Fatos verificados (26/11/2026)

| Fato | Valor | Comando |
| --- | --- | --- |
| Testes da API | 140 passed, 2 xfailed | `cd apps/api && pytest -q` (Postgres 16 na 5433) |
| Web: lint / unit / proxy / e2e | 0 erros (3 avisos) / 93 passed / 4 passed / 4 passed | `npm run lint`, `npm test`, `npm run test:proxy`, `npm run test:e2e` |
| CI na `master` (2e1e7ec) | API CI e Web CI verdes; Web Deploy falhou: `--token` sem valor | Actions do repo, run 45874983463 |
| Render `ludens-api` | Docker, `rootDir` vazio, `dockerfilePath ./Dockerfile`; deploy live = d6f7c89 (antes do monorepo) | API do Render, `GET /v1/services` |
| Dockerfile da API | agora em `apps/api/Dockerfile` | `git ls-files` |
| Colaboradores do repo | só `igorSeberino` | `GET repos/igorSeberino/api.ludens/collaborators` |
| Proteção da `master` | nenhuma | `GET .../branches/master/protection` → 404 |
| Action do Sonar | `SonarSource/sonarqube-scan-action` (a `sonarcloud-github-action` está arquivada) | `gh api search/repositories` |

## 6. Tarefas

Todas com prazo 27/11/2026, antes da apresentação. Cada tarefa entra por branch curta e PR
revisado conforme D6.

| T | Entrega | Atende | Responsável | Revisor | Bloqueada por |
| --- | --- | --- | --- | --- | --- |
| T0 | Convidar os 4 integrantes como colaboradores com permissão de escrita | R1, D6 | @igorSeberino | — | — |
| T1 | SonarQube Cloud analisando `apps/api` e `apps/web` com cobertura | R5, R6, D1 | @igorSeberino | @RenatoColin | T0 |
| T2 | Deploy da API e da web funcionando a partir do monorepo | R1, R2 (DT-05), D3, D7 | @igorSeberino | @RenatoColin | T0 |
| T3 | Backend sem bugs e vulnerabilidades do Sonar e sem função acima do limite de complexidade | R2 (DT-04, DT-11, DT-12), R3 | @adrian-cesar | @RenatoColin | T1 |
| T4 | Frontend sem bugs e vulnerabilidades do Sonar e com duplicações apontadas resolvidas | R2 (DT-12, DT-13), R3, D5 | @Diegonessler | @RenatoColin | T1 |
| T5 | Documentação alinhada ao monorepo e débitos restantes registrados como issue | R2 (DT-09, DT-10) | @gabrielcarvallho | @RenatoColin | T0 |
| T6 | Antes/depois do Sonar e teste de fumaça no ambiente publicado | R1, R5 | @RenatoColin | @Diegonessler | T2, T3, T4 |
| T7 | Apresentação de 27/11 | R4, R5 | @Diegonessler | — | T6 |

Grafo: `T0 → {T1, T2, T5}`, `T1 → {T3, T4}`, `{T2, T3, T4} → T6 → T7`.

### Critérios de aceite

**T0.** Os 4 convites aceitos: `GET repos/igorSeberino/api.ludens/collaborators` lista 5 logins
e `GET .../invitations` retorna `[]`.

**T1.**
- Projeto criado no SonarQube Cloud; segredo `SONAR_TOKEN` no repositório.
- Workflow em `.github/workflows/` roda a análise em push na `master` e em PR; a execução na
  `master` termina verde.
- O dashboard mostra arquivos de `apps/api/src` e `apps/web/src` e cobertura maior que 0 % nos
  dois (API: relatório XML do `pytest --cov`; web: `lcov` do `jest --coverage`).
- Primeira análise da `master` registrada como linha de base (bugs, vulnerabilidades, hotspots,
  code smells, duplicação, cobertura), com print, para T6.
- Link do projeto no `README.md` da raiz.
- Conferir na documentação atual do SonarQube Cloud se a análise automática precisa ser
  desligada quando a análise roda pelo CI.

**T2.**
- Render `ludens-api` com diretório raiz `apps/api` (ou Dockerfile e contexto apontando para
  lá); deploy do último commit da `master` com status `live`; `GET https://ludens-api.onrender.com/health` → 200.
- Render `ludens-web` (raiz `apps/web`) com `API_PROXY_URL` (D7) e deploy `live`; em
  `https://ludens-web.onrender.com` é possível cadastrar, entrar e abrir o detalhe de uma sessão.
- API com `FRONTEND_BASE_URL` e `ALLOWED_ORIGINS` apontando para `https://ludens-web.onrender.com`.
- Workflows de deploy de terceiros (`api-deploy.yml`, `web-deploy.yml`, `_publish.yaml`,
  `_terraform.yaml`) removidos.

**T3.**
- No SonarQube Cloud, `apps/api`: 0 bugs, 0 vulnerabilidades, 100 % dos security hotspots
  revisados.
- Nenhuma função de `apps/api/src` acusada pela regra de complexidade cognitiva do Sonar
  (inclui `simulate` em `booking`, CC 17 na N3).
- Code smells e duplicação de `apps/api` menores que a linha de base de T1.
- `cd apps/api && pytest -q` → `140 passed, 2 xfailed` ou mais testes passando, nenhum falhando.

**T4.**
- No SonarQube Cloud, `apps/web`: 0 bugs, 0 vulnerabilidades, 100 % dos hotspots revisados.
- Tipo `Reservation` definido num lugar só (DT-12); `src/lib/fetcher.ts` sem import de feature (DT-13).
- Code smells e duplicação de `apps/web` menores que a linha de base de T1.
- `npm run lint` com 0 erros; `npm test`, `npm run test:proxy` e `npm run build` passando.

**T5.**
- Nenhum link para `gcarvalhow/*` ou `CodePenguinsCorp/*` como repositório atual em `docs/` e
  nos READMEs.
- `docs/team/overview.md` com os papéis da N3 (D4) e o backlog apontando para as issues deste
  repositório.
- `CODEOWNERS` com o caminho real das migrations (`/apps/api/src/migrations/`).
- `docs/docs/superpowers/` removido (DT-09 do relatório).
- Uma issue com a label `débito técnico` para cada DT do §4 (DT-01, 02, 03, 06, 07, 08, 14, 15),
  com descrição, motivo, impacto e proposta (política de `team/overview.md`).

**T6.**
- Tabela antes/depois com os números copiados do SonarQube Cloud (linha de base de T1 × última
  análise da `master`): bugs, vulnerabilidades, hotspots, code smells, duplicação, cobertura,
  status do Quality Gate.
- Teste de fumaça no ambiente publicado, cada passo marcado ok/falhou: cadastro, login, busca,
  reserva, compra simulada, cancelamento.
- Todos os PRs de T1–T5 revisados e aprovados antes do merge.

**T7.**
- Apresentação mostrando: o dashboard do SonarQube Cloud ao vivo, a tabela de T6, os débitos
  atendidos (DT-04, 05, 09, 10, 11, 12, 13) e os registrados para depois, e a demonstração no
  ambiente publicado.
- Cada integrante apresenta a parte de que foi responsável.

## 7. Pronto

- [ ] Última execução de API CI, Web CI e da análise Sonar na `master` → verdes
- [ ] SonarQube Cloud: Quality Gate da `master` → Passed; 0 bugs e 0 vulnerabilidades em `apps/api` e `apps/web`
- [ ] `GET https://ludens-api.onrender.com/health` → 200; web no Render completa a compra simulada
- [ ] Tabela antes/depois (T6) pronta para a apresentação
