variable "subnet_ids" {
  type        = list(string)
  description = "Subnety w których siedzi baza — z modułu networking"
}

variable "vpc_id" {
  type        = string
  description = "ID sieci VPC — potrzebne do security group"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Hasło do bazy — nigdy nie wpisuj wprost, używaj tfvars"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR całej sieci — tylko z tej sieci można połączyć się z bazą"
}