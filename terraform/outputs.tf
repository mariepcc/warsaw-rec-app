output "dns_name_servers" {
  description = "NS records — wklej do rejestratora domeny"
  value       = module.dns.name_servers
}

output "dns_zone_id" {
  value = module.dns.zone_id
}

output "repository_name" {
  value = module.ecr.repository_name
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "ecs_service_name" {
  value = module.ecs.service_name
}

output "github_actions_role_arn" {
  value       = module.ga.role_arn
  description = "Wklej jako AWS_ROLE_ARN w GitHub Secrets"
}