# pipelines

Os templates vivem em `.github/workflows/` na raiz do monorepo e são chamados localmente.
O workflow `_terraform.yaml` exige `backend-config` com conteúdo HCL do novo backend Azure.

<p align="center">
  <img src=".github/assets/logo.png" alt="ludens" width="180">

  <h3 align="center">ludens</h3>

  <p align="center">
    Plataforma de Venda de Ingressos para Teatro Comunitário
  </p>
</p>

Workflows reutilizáveis (`workflow_call`) de CI/CD pros repositórios da plataforma Ludens
(`api.ludens`, e futuramente `web.ludens`). Cada repo consumidor chama estes workflows em vez
de reimplementar test/build/deploy do zero.

## Workflows disponíveis

### `_test.yaml`

Sobe as dependências do projeto via `docker compose`, instala o pacote Python e roda `pytest`.
Não falha se ainda não houver suíte de testes (trata "nenhum teste coletado" como sucesso).

```yaml
jobs:
  test:
    uses: ./.github/workflows/_test.yaml
    with:
      working-directory: .
      compose-file: docker/docker-compose.Development.yml
```

| Input | Obrigatório | Default | Descrição |
|---|---|---|---|
| `working-directory` | não | `.` | Diretório de onde instalar o pacote e rodar `pytest` |
| `compose-file` | não | — | Path do `docker-compose` com as dependências de teste (ex.: Postgres). Se omitido, não sobe nada |

### `_build.yaml`

Builda a imagem Docker do projeto a partir do `Dockerfile` na raiz.

```yaml
jobs:
  build:
    uses: ./.github/workflows/_build.yaml
    with:
      image-name: api-ludens:ci
```

| Input | Obrigatório | Default | Descrição |
|---|---|---|---|
| `image-name` | sim | — | Tag da imagem gerada pelo `docker build` |

### `_publish.yaml`

Builda a imagem Docker do projeto e publica no GHCR, com as tags `:latest` e `:<sha>`.
Autentica com `secrets.GITHUB_TOKEN` (automático, sem PAT nova) via `docker/login-action`.

```yaml
jobs:
  publish:
    uses: ./.github/workflows/_publish.yaml
    with:
      image-name: ghcr.io/igorseberino/api.ludens
```

| Input | Obrigatório | Default | Descrição |
|---|---|---|---|
| `image-name` | sim | — | Referência completa da imagem a publicar (ex.: `ghcr.io/owner/repo`), sem tag |
| `working-directory` | não | `.` | Diretório com o `Dockerfile` |

### `_terraform.yaml`

Roda `terraform fmt -check` / `init` / `validate` / `plan` sempre; só roda `apply` se o input
`apply` vier `true` — decisão do workflow chamador, nunca do reutilizável. Autentica no Azure via
as quatro `secrets` de Service Principal (`ARM_*`), passadas pelo chamador (`secrets: inherit` ou
uma a uma).

```yaml
jobs:
  terraform:
    uses: ./.github/workflows/_terraform.yaml
    with:
      working-directory: terraform
      apply: false
    secrets: inherit
```

| Input | Obrigatório | Default | Descrição |
|---|---|---|---|
| `working-directory` | não | `.` | Diretório com o módulo raiz do Terraform |
| `apply` | não | `false` | Roda `terraform apply -auto-approve` depois de um `plan` limpo |
| `tf-vars` | não | — | `TF_VAR_*` extras a exportar antes do `plan`/`apply`, um `CHAVE=valor` por linha |

| Secret | Obrigatório | Descrição |
|---|---|---|
| `ARM_CLIENT_ID` / `ARM_CLIENT_SECRET` / `ARM_SUBSCRIPTION_ID` / `ARM_TENANT_ID` | sim | Credenciais do Service Principal do Azure (`az ad sp create-for-rbac`) |

## Convenção

- Prefixo `_` no nome do arquivo = workflow reutilizável (`on: workflow_call`), nunca disparado
  sozinho por push/PR.
- Branch padrão `master`, mesmo padrão dos outros repositórios `*.ludens`.
