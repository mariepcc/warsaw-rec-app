resource "aws_cognito_user_pool" "warsaw_rec" {
  name = "${var.project_name}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Warsaw Rec — kod weryfikacyjny"
    email_message        = "Twój kod weryfikacyjny: {####}"
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "mobile" {
  name         = "${var.project_name}-mobile"
  user_pool_id = aws_cognito_user_pool.warsaw_rec.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  access_token_validity  = 1   
  id_token_validity      = 1
  refresh_token_validity = 30  

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"
}