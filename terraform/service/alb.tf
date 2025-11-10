# Update the Application Load Balancer to forward appropriate requests
# to the backend service running in ECS Fargate.
# Create target group, used by ALB to forward requests to ECS service
resource "aws_lb_target_group" "tech_audit_tool_fargate_tg" {
  name        = "${var.service_subdomain}-fargate-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.terraform_remote_state.ecs_infrastructure.outputs.vpc_id

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 120
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Use the module to get highest current priority
module "alb_listener_priority" {
  source                = "git::https://github.com/ONS-Innovation/keh-alb-listener-tf-module.git?ref=v1.0.0"
  aws_access_key_id     = var.aws_access_key_id
  aws_secret_access_key = var.aws_secret_access_key
  region                = var.region
  listener_arn          = data.terraform_remote_state.ecs_infrastructure.outputs.application_lb_https_listener_arn
}


# Create a listener rule to forward requests to the target group ensuring the 
# priority takes into account the existing rules 
resource "aws_lb_listener_rule" "tech_audit_tool_listener_rule" {
  listener_arn = data.terraform_remote_state.ecs_infrastructure.outputs.application_lb_https_listener_arn
  priority     = module.alb_listener_priority.highest_priority + 1

  condition {
    host_header {
      values = ["${local.service_url}"]
    }
  }

  action {
    target_group_arn = aws_lb_target_group.tech_audit_tool_fargate_tg.arn
    type             = "forward"
  }
}