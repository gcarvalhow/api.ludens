output "fqdn" {
  description = "Fully qualified domain name of the Postgres server"
  value       = azurerm_postgresql_flexible_server.this.fqdn
}

output "database_name" {
  value = azurerm_postgresql_flexible_server_database.this.name
}
