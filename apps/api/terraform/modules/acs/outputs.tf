output "connection_string" {
  description = "ACS_CONNECTION_STRING for src/app/config.py"
  value       = azurerm_communication_service.this.primary_connection_string
  sensitive   = true
}

output "sender_address" {
  description = "ACS_SENDER_ADDRESS for src/app/config.py — the default DoNotReply sender on the managed domain"
  value       = "DoNotReply@${azurerm_email_communication_service_domain.this.mail_from_sender_domain}"
}
