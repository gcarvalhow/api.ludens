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

* `_test.yaml`, `_build.yaml`, `_publish.yaml`, `_terraform.yaml`: templates
  reutilizáveis vindos de `pipelines.ludens`, agora chamados localmente
  (`uses: ./.github/workflows/_test.yaml`).
* `api-ci.yml` e `api-deploy.yml`: rodam só quando `apps/api/**` muda.
* `web-ci.yml` e `web-deploy.yml`: rodam só quando `apps/web/**` muda.

## Rodando localmente

```bash
cd apps/api   # ver apps/api/README.md
cd apps/web   # ver apps/web/README.md
```
