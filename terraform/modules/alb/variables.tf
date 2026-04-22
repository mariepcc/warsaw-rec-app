variable "vpc_id" {
  type        = string
  description = "ID sieci VPC"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Minimum 2 subnety w różnych strefach — wymóg ALB"
}

variable "certificate_arn" {
  type        = string
  description = "ARN certyfikatu ACM (z modułu ssl)"
}