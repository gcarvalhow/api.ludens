variable "name" {
  description = "PostgreSQL Flexible Server name (globally unique — forms <name>.postgres.database.azure.com)"
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "database_name" {
  description = "Application database name"
  type        = string
  default     = "ludens"
}

variable "admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
}

variable "admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "postgres_version" {
  description = "PostgreSQL major version — matches docker/docker-compose.Development.yml (postgres:16)"
  type        = string
  default     = "16"
}

variable "sku_name" {
  description = "Flexible Server compute SKU — burstable tier, proportional to a small community-theater deployment"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  type    = number
  default = 32768
}
