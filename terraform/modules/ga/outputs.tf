output "role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "Skopiuj tę wartość jako sekret AWS_ROLE_ARN w GitHub"
}