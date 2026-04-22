variable "vpc_id" {
  type        = string
  description = "ID sieci VPC"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnety w których uruchamiają się kontenery"
}

variable "app_image" {
  type        = string
  description = "URL obrazu Dockera z ECR — ECS pobiera stąd kontener"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "ID Cognito — aplikacja weryfikuje tym tokeny użytkowników"
}

variable "cognito_app_client_id" {
  type        = string
  description = "ID klienta Cognito — potrzebne do logowania"
}

variable "database_url" {
  type        = string
  sensitive   = true
  description = "Pełny connection string do bazy danych"
}

variable "alb_security_group_id" {
  type        = string
  description = "Security group ALB — ECS wpuszcza ruch tylko stamtąd"
}

variable "target_group_arn" {
  type        = string
  description = "ARN target group — ECS rejestruje tu kontenery żeby ALB je widział"
}

variable "alb_https_listener_arn" {
  type        = string
  description = "ARN listenera HTTPS — gwarantuje że ALB istnieje przed ECS"
}