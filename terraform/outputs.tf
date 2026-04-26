output "dns_name_servers" {
  description = "NS records — wklej do rejestratora domeny"
  value       = module.dns.name_servers
}

output "dns_zone_id" {
  value = module.dns.zone_id
}