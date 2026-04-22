output "repository_url" {
  value       = aws_ecr_repository.this.repository_url
  description = "URL repozytorium — używany w ECS do pullowania obrazu"
}

output "repository_name" {
  value = aws_ecr_repository.this.name
}