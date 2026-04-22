variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "app_name" {
  type    = string
  default = "goexplore"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "db_username" {
  type    = string
  default = "goexplore_user"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "domain_name" {
  description = "Domena aplikacji, np. goexplore.app"
  type        = string
}