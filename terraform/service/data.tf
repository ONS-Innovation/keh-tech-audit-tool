# Get the ecs infrastructure outputs from the remote state data source
data "terraform_remote_state" "ecs_infrastructure" {
  backend = "s3"
  config = {
    bucket = "${var.domain}-tf-state"
    key    = "${var.domain}-ecs-infra/terraform.tfstate"
    region = "eu-west-2"
  }
}
data "aws_route53_zone" "route53_domain" {
  name = local.url
}

# Resolve the pushed tech audit tool image
data "aws_ecr_image" "tech_audit_tool_image" {
  repository_name = var.container_image
  image_tag       = var.container_ver
}