resource "azurerm_communication_service" "this" {
  name                = "${var.name_prefix}-acs"
  resource_group_name = var.resource_group_name
  data_location       = var.data_location
}

resource "azurerm_email_communication_service" "this" {
  name                = "${var.name_prefix}-email"
  resource_group_name = var.resource_group_name
  data_location       = var.data_location
}

# AzureManagedDomain: Microsoft provisions and pre-verifies a *.azurecomm.net
# domain automatically — no DNS records to configure. Deliberate choice while
# there's no custom domain (see terraform/README.md and issue #57); revisit
# with "CustomerManaged" once a real domain exists.
resource "azurerm_email_communication_service_domain" "this" {
  name              = "AzureManagedDomain"
  email_service_id  = azurerm_email_communication_service.this.id
  domain_management = "AzureManaged"
}

# Attaches the (managed) sender domain to the Communication Service — without
# this the connection string above can't actually send mail "from" it.
resource "azurerm_communication_service_email_domain_association" "this" {
  communication_service_id = azurerm_communication_service.this.id
  email_service_domain_id  = azurerm_email_communication_service_domain.this.id
}
