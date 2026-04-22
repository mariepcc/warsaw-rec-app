output "app_fqdn" {
  description = "Pełna domena aplikacji"
  value       = aws_route53_record.app.fqdn
}