resource "azurerm_resource_group" "this" {
  name     = var.name
  location = var.location

  tags = {
    project     = "ludens"
    environment = var.environment
  }
}
