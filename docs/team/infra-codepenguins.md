# Infraestrutura — CodePenguinsCorp

Os forks mantêm Azure, GHCR e Vercel. Configure contas e credenciais da nova
equipe e um state separado, sem reutilizar os recursos da equipe anterior.

## Preparação

1. Publicar primeiro as alterações de `pipelines.ludens`: a API depende do
   novo input `backend-config`. Publicar a API depois.
2. Habilitar Actions nos forks e permitir os workflows da organização.
3. Criar um projeto Vercel e configurar `NEXT_PUBLIC_API_URL` com a URL da
   nova API. No fork do frontend, cadastrar `VERCEL_TOKEN`, `VERCEL_ORG_ID`
   e `VERCEL_PROJECT_ID` como secrets.
4. Criar um Storage Account Azure com um container privado para o state.
   Os nomes sugeridos em `api.ludens/terraform/backend.hcl.example` precisam
   ter disponibilidade global verificada.
5. No fork da API, cadastrar os secrets `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`,
   `ARM_SUBSCRIPTION_ID` e `ARM_TENANT_ID`. A identidade precisa acessar o
   state e provisionar os recursos da assinatura da equipe.
6. Cadastrar as variáveis de repositório `TF_BACKEND_CONFIG` (conteúdo HCL
   baseado em `backend.hcl.example`), `FRONTEND_BASE_URL` (domínio definitivo
   da Vercel) e `ALLOWED_ORIGINS` (array JSON de origens em uma linha).
7. Conferir região, cotas e nomes em `terraform/variables.tf` na assinatura
   nova. Os recursos agora têm nomes com prefixo CodePenguins.
8. Executar manualmente o Deploy da API em `master` com `apply=false`.
   Isso publica a imagem e gera o plano. Confirmar que o pacote GHCR
   `ghcr.io/codepenguinscorp/api.ludens` é público, pois o App Service não
   possui autenticação de registry privado.
9. Revisar o plano e executar com `apply=true`. Esse segundo disparo gera
   e aplica outro plano; conferir também seu commit e sua configuração.
10. Executar migrations Alembic na nova base e verificar `/health`, login
    e e-mail. O workflow atual não executa migrations automaticamente.

O frontend faz deploy somente após CI bem-sucedido de push na `master` do
próprio repositório. PRs não executam o deploy com secrets.

## Terraform local

Copiar `terraform/backend.hcl.example` para `terraform/backend.hcl`, ajustar
os nomes e autenticar na assinatura nova. Dentro de `terraform`, executar:

```sh
terraform init -input=false -backend-config=backend.hcl
terraform fmt -check -recursive
terraform validate
terraform plan -var='docker_image_name=ghcr.io/codepenguinscorp/api.ludens:COMMIT_SHA' -var='frontend_base_url=https://SEU-DOMINIO' -var='allowed_origins=["https://SEU-DOMINIO"]'
```

Arquivos de state, planos, `backend.hcl` e `.tfvars` locais são ignorados.
O README Terraform herdado descreve recursos e domínios da equipe anterior.
Nenhum recurso cloud foi criado durante esta preparação. Após publicar e
validar os workflows, fixar suas referências reutilizáveis em um SHA revisado.
