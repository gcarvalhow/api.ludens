# terraform/

Infraestrutura Azure de `api.ludens`: Resource Group, Azure Database for PostgreSQL Flexible
Server, e o Azure App Service (Linux, container) que roda a API. Segredos (senha do Postgres,
`JWT_SECRET_KEY`) são gerados pelo próprio Terraform (`random_password`) e expostos só via
Application Settings do App Service — sem Key Vault, proporcional à escala do projeto.

## Bootstrap do state remoto (uma vez só, manual)

O backend `azurerm` (`backend.tf`) guarda o `.tfstate` num Storage Account — mas esse Storage
Account não pode ser gerenciado pelo próprio Terraform que depende dele pra existir primeiro.
Criar uma vez, à mão, com a Azure CLI (`az login` antes):

```bash
az group create --name rg-ludens-tfstate --location "Brazil South"

az storage account create \
  --name ludensterraformstate \
  --resource-group rg-ludens-tfstate \
  --location "Brazil South" \
  --sku Standard_LRS \
  --encryption-services blob

az storage container create \
  --name tfstate \
  --account-name ludensterraformstate
```

Se `ludensterraformstate` já estiver em uso por outra conta Azure (nome de Storage Account é
único globalmente), troque o nome aqui e em `backend.tf`.

## Uso

```bash
cd terraform
terraform init      # baixa os providers e conecta no backend remoto
terraform fmt -check
terraform validate
terraform plan       # nunca cria/muda nada sozinho
terraform apply       # só depois de revisar o plan — cria recursos reais, tem custo
```

Autenticação com o Azure: `az login` (interativo) ou variáveis `ARM_CLIENT_ID` /
`ARM_CLIENT_SECRET` / `ARM_SUBSCRIPTION_ID` / `ARM_TENANT_ID` (service principal — é assim que o
pipeline de deploy, issue #52, vai autenticar via GitHub Actions).

## Sem domínio próprio por enquanto

Sem orçamento pra registrar um domínio (nem o GitHub Student Developer Pack disponível) — a API
fica no hostname gratuito padrão do App Service (`output.app_service_hostname`, algo como
`ludens-api.azurewebsites.net`). Domínio próprio e certificado gerenciado ficam pra issue #57
quando isso for resolvido, sem bloquear o resto.

## O que ainda falta (outras issues da Workstream D)

- **#50** — módulo Terraform pro Azure Communication Services; troca `EMAIL_BACKEND` de `smtp`
  pra `acs` neste módulo e preenche `ACS_CONNECTION_STRING`/`ACS_SENDER_ADDRESS`.
- **#52** — pipeline de deploy (`terraform plan`/`apply` via GitHub Actions + deploy da imagem
  Docker no App Service).
- **#57** — domínio próprio + certificado gerenciado, quando existir orçamento/decisão.
