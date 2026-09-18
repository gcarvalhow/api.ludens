variable "name_prefix" {
  type    = string
  default = "ludens"
}

variable "resource_group_name" {
  type = string
}

variable "data_location" {
  description = "Azure Communication Services data residency region — separate from the App Service/Postgres `location` (azurerm_communication_service/azurerm_email_communication_service take no `location` argument at all)"
  type        = string
  default     = "Brazil"
}
