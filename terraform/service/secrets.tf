# Secrets for rotated IAM user access keys
resource "aws_secretsmanager_secret" "access_key" {
  name        = "${var.domain}-${var.service_subdomain}-access-key"
  description = "Access Key ID for tech audit tool IAM user"
}

resource "aws_secretsmanager_secret" "secret_key" {
  name        = "${var.domain}-${var.service_subdomain}-secret-key"
  description = "Secret Access Key for tech audit tool IAM user"
}