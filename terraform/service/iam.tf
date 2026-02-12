# Task role - this is the role that the application itself will use
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.domain}-${var.service_subdomain}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Secrets Manager access
resource "aws_iam_policy" "secrets_manager_policy" {
  name        = "${var.domain}-${var.service_subdomain}-secrets-manager-policy"
  description = "Allow ECS task to read secrets from AWS Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = "secretsmanager:GetSecretValue"
        Resource = [
          "arn:aws:secretsmanager:${var.region}:${var.aws_account_id}:secret:${var.ui_secret_name}*",
          "arn:aws:secretsmanager:${var.region}:${var.aws_account_id}:secret:${var.api_secret_name}*"
        ]
      }
    ]
  })
}

# IAM Policy for S3 access
resource "aws_iam_policy" "s3_read_policy" {
  name        = "${var.domain}-${var.service_subdomain}-s3-read-policy"
  description = "Allow ECS task to read objects from S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadAccess"
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = "arn:aws:s3:::${var.api_bucket_name}/*"
      }
    ]
  })
}

# Attach Secrets Manager policy to task role
resource "aws_iam_role_policy_attachment" "ecs_secrets_manager_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.secrets_manager_policy.arn
}

# Attach S3 policy to task role
resource "aws_iam_role_policy_attachment" "ecs_s3_read_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# IAM User Group
resource "aws_iam_group" "group" {
  name = "${var.domain}-${var.service_subdomain}-user-group"
  path = "/"
}

# Attach managed policies to user group
resource "aws_iam_group_policy_attachment" "group_secrets_manager_policy_attachment" {
  group = aws_iam_group.group.name
  policy_arn = aws_iam_policy.secrets_manager_policy.arn
}

resource "aws_iam_group_policy_attachment" "group_s3_read_policy_attachment" {
  group = aws_iam_group.group.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# IAM User
resource "aws_iam_user" "user" {
  name = "${var.domain}-${var.service_subdomain}"
  path = "/"
}

# Assign IAM User to group
resource "aws_iam_user_group_membership" "user_group_attach" {
  user = aws_iam_user.user.name

  groups = [
    aws_iam_group.group.name
  ]
}

# IAM Key Rotation Module
module "iam_key_rotation" {
  source = "git::https://github.com/ONS-Innovation/keh-aws-iam-key-rotation.git"

  iam_username          = aws_iam_user.user.name
  access_key_secret_arn = aws_secretsmanager_secret.access_key.arn
  secret_key_secret_arn = aws_secretsmanager_secret.secret_key.arn
  rotation_in_days      = 90
}