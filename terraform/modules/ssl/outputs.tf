output "certificate_arn" {
  description = "ARN zwalidowanego certyfikatu ACM"
  value       = aws_acm_certificate_validation.cert.certificate_arn
}