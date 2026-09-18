variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "Brazil South"
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
