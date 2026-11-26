# Remote state — the storage account/container below are NOT managed by this
# Terraform (a backend can't provision the thing it depends on to exist first).
# Bootstrap them once by hand — see README.md.
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-ludens-tfstate"
    storage_account_name = "ludensterraformstate"
    container_name       = "tfstate"
    key                  = "production.tfstate"
  }
}
