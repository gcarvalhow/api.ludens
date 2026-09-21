variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

# Brazil South and East US both have a 0 quota for every App Service Basic
# SKU (B1/B2/B3) on this subscription (confirmed live against the real
# subscription, not documentation) — Central US is the first region that
# actually allows creating one. Postgres Flexible Server B1ms confirmed
# available there too (App Service and Postgres must share a region — no
# cross-region latency between the API and its own database).
variable "location" {
  description = "Azure region"
  type        = string
  default     = "Central US"
}

variable "resource_group_name" {
  type    = string
  default = "rg-ludens-production"
}

# App Service and Postgres names form public hostnames
# (<name>.azurewebsites.net, <name>.postgres.database.azure.com) that are
# unique across the whole of Azure, not just this project — if the default
# is already taken, `terraform apply` fails with a clear error; just change
# the variable.
variable "app_service_name" {
  type    = string
  default = "ludens-api"
}

variable "postgres_server_name" {
  type    = string
  default = "ludens-psql"
}

variable "communication_service_name" {
  type    = string
  default = "ludens-acs"
}

variable "email_service_name" {
  type    = string
  default = "ludens-email"
}

variable "postgres_admin_username" {
  type    = string
  default = "ludensadmin"
}

# web.ludens's stable production URL on Vercel (confirmed with the user
# 2026-09-21, not a per-deploy preview alias) — localhost stays in the list
# too so a local frontend dev server can still hit the production API.
variable "allowed_origins" {
  description = "CORS-allowed origins"
  type        = list(string)
  default     = ["http://localhost:3000", "https://web-ludens.vercel.app"]
}

variable "frontend_base_url" {
  description = "Base URL used to build links in transactional e-mails"
  type        = string
  default     = "https://web-ludens.vercel.app"
}

variable "email_from_address" {
  type    = string
  default = "no-reply@ludens.local"
}

variable "email_from_name" {
  type    = string
  default = "Ludens"
}
