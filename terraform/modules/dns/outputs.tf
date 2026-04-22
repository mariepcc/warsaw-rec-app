output "zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "NS records — wklej je ręcznie do swojego rejestratora"
  value       = aws_route53_zone.main.name_servers
}