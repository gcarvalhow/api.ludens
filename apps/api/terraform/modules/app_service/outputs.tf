output "name" {
  value = azurerm_linux_web_app.this.name
}

output "default_hostname" {
  description = "Free *.azurewebsites.net hostname the app is reachable at"
  value       = azurerm_linux_web_app.this.default_hostname
}
