resource "azurerm_postgresql_flexible_server" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location

  version = var.postgres_version

  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  sku_name   = var.sku_name
  storage_mb = var.storage_mb

  backup_retention_days = 7

  authentication {
    password_auth_enabled = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
}

# App Service is not VNet-integrated, so it reaches Postgres over its public
# endpoint — this rule (0.0.0.0-0.0.0.0 is the azurerm provider's documented
# convention for "allow access from Azure services") is what makes that work.
# VNet integration is a future hardening step (no infra ADR covers this yet —
# tracked informally against issue #49/#57, not a documented decision).
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
