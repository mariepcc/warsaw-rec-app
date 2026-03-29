variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Nazwa projektu"
  type        = string
  default     = "warsaw-rag"
}

variable "environment" {
  description = "Środowisko"
  type        = string
  default     = "dev"
}