output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.warsaw_rec.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.warsaw_rec.arn
}

output "client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.mobile.id
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}