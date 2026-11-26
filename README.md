# ludens

Monorepo do ludens. Junta os quatro repositórios que antes viviam separados em
`CodePenguinsCorp`, com o histórico de commits de cada um preservado.

| Pasta        | Origem               | O que é                                           |
| ------------ | -------------------- | ------------------------------------------------- |
| `apps/api/`  | `api.ludens`         | Backend FastAPI ([README](apps/api/README.md))    |
| `apps/web/`  | `web.ludens`         | Frontend Next.js ([README](apps/web/README.md))   |
| `docs/`      | `docs.ludens`        | Produto, arquitetura, specs e time ([README](docs/README.md)) |
| `pipelines/` | `pipelines.ludens`   | Documentação dos workflows reutilizáveis ([README](pipelines/README.md)) |

## CI/CD

O GitHub só lê workflows de `.github/workflows/` na raiz, então eles moram lá:

* `_test.yaml` e `_build.yaml`: templates reutilizáveis vindos de
  `pipelines.ludens`, chamados localmente (`uses: ./.github/workflows/_test.yaml`).
* `api-ci.yml`: roda só quando `apps/api/**` muda.
* `web-ci.yml`: roda só quando `apps/web/**` muda.

## Deploy

No Render, com deploy automático a cada push na `master`:

* API: serviço `ludens-api` (Docker, raiz `apps/api`), em
  <https://ludens-api.onrender.com>, com o banco `ludens-db`.
* Web: serviço `ludens-web` (Node, raiz `apps/web`), em
  <https://ludens-web.onrender.com>. O Next.js encaminha `/api` para a API
  pela variável `API_PROXY_URL`.

## Rodando localmente

```bash
cd apps/api   # ver apps/api/README.md
cd apps/web   # ver apps/web/README.md
```
