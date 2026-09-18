resource "random_password" "postgres_admin" {
  length  = 24
  special = false
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

module "resource_group" {
  source = "./modules/resource_group"

  name        = var.resource_group_name
  location    = var.location
  environment = var.environment
}

module "postgresql" {
  source = "./modules/postgresql"

  name                = var.postgres_server_name
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  admin_username      = var.postgres_admin_username
  admin_password      = random_password.postgres_admin.result
}

module "app_service" {
  source = "./modules/app_service"

  name                = var.app_service_name
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location

  app_settings = {
    ENVIRONMENT = var.environment

    DATABASE_URL = "postgresql+asyncpg://${var.postgres_admin_username}:${random_password.postgres_admin.result}@${module.postgresql.fqdn}:5432/${module.postgresql.database_name}"

    JWT_SECRET_KEY              = random_password.jwt_secret.result
    ACCESS_TOKEN_EXPIRE_MINUTES = "30"
    REFRESH_TOKEN_EXPIRE_DAYS   = "7"

    ALLOWED_ORIGINS = jsonencode(var.allowed_origins)

    OUTBOX_RELAY_INTERVAL_SECONDS = "2"

    # Stays "smtp" (not "acs") until issue #50 provisions the ACS resource —
    # no point pointing at a backend that doesn't exist yet. #50 flips this
    # to "acs" and fills the two connection settings below from its own
    # module outputs.
    EMAIL_BACKEND         = "smtp"
    EMAIL_FROM_ADDRESS    = var.email_from_address
    EMAIL_FROM_NAME       = "Ludens"
    ACS_CONNECTION_STRING = ""
    ACS_SENDER_ADDRESS    = ""

    FRONTEND_BASE_URL = var.frontend_base_url
  }
}
