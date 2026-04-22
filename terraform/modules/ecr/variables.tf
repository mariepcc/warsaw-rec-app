variable "repository_name" {
  type        = string
  description = "Nazwa repozytorium ECR"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tagi dla zasobu"
}