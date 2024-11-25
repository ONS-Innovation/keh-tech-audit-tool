# Create Alias record to forward service URL request to ALB
resource "aws_route53_record" "route53_record" {
  zone_id = data.aws_route53_zone.route53_domain.zone_id
  name    = local.service_url
  type    = "A"

  alias {
    name                   = data.terraform_remote_state.ecs_infrastructure.outputs.service_lb_dns_name
    zone_id                = data.terraform_remote_state.ecs_infrastructure.outputs.service_lb_zone_id
    evaluate_target_health = true
  }

}