output "name" {
  description = "Resource group name"
  value       = azurerm_resource_group.this.name
}

output "location" {
  description = "Azure region the resource group was created in"
  value       = azurerm_resource_group.this.location
}
