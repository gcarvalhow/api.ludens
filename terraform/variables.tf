variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region"
  type        = string
  # Brazil South and East US both have a 0 quota for every App Service Basic
  # SKU (B1/B2/B3) on this subscription (confirmed live against the real
  # subscription, not documentation) — Central US is the first region that
  # actually allows creating one. Postgres Flexible Server B1ms confirmed
  # available there too (App Service and Postgres must share a region — no
  # cross-region latency between the API and its own database).
  default = "Central US"
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

# No custom domain yet (see the plan's "Domínio" note) — these default to the
# same placeholders app/config.py itself falls back to in development. Update
# once a real frontend origin/domain exists; nothing here assumes ludens.app.
variable "allowed_origins" {
  description = "CORS-allowed origins"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "frontend_base_url" {
  description = "Base URL used to build links in transactional e-mails"
  type        = string
  default     = "http://localhost:3000"
}

variable "email_from_address" {
  type    = string
  default = "no-reply@ludens.local"
}

variable "email_from_name" {
  type    = string
  default = "Ludens"
}
