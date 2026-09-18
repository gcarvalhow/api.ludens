output "app_service_hostname" {
  description = "Free hostname the API is reachable at until a custom domain (issue #57) exists"
  value       = module.app_service.default_hostname
}

output "postgres_fqdn" {
  value = module.postgresql.fqdn
}
