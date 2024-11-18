output "ecs_task_definition_arn" {
  value = aws_ecs_task_definition.ecs_service_definition.arn
}

output "ecs_task_definition_revision" {
  value = aws_ecs_task_definition.ecs_service_definition.revision
}

output "security_group_id" {
  value = aws_security_group.allow_rules_service.id
}

output "service_url" {
  value = local.service_url
}