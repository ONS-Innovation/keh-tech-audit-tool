terraform {
  backend "s3" {
    # Backend is selected using terraform init -backend-config=path/to/backend-<env>.tfbackend
    # bucket         = "sdp-dev-tf-state"
    # key            = "sdp-dev-ecs-example-service/terraform.tfstate"
    # region         = "eu-west-2"
    # dynamodb_table = "terraform-state-lock"
  }

}

resource "aws_cloudwatch_log_group" "ecs_service_logs" {
  name              = "/ecs/ecs-service-${var.service_subdomain}-application"
  retention_in_days = var.log_retention_days
}


resource "aws_ecs_task_definition" "ecs_service_definition" {
  family = "ecs-service-${var.service_subdomain}-application"
  container_definitions = jsonencode([
    {
      name      = "${var.service_subdomain}-task-application"
      image     = "${var.aws_account_id}.dkr.ecr.${var.region}.amazonaws.com/${var.container_image}:${var.container_ver}"
      cpu       = 0,
      essential = true
      portMappings = [
        {
          name          = "${var.service_subdomain}-${var.container_port}-tcp",
          containerPort = var.container_port,
          hostPort      = var.container_port,
          protocol      = "tcp",
          appProtocol   = "http"
        }
      ],
      environment = [
        {
          name  = "AWS_ACCESS_KEY_ID"
          value = var.aws_access_key_id
        },
        {
          name  = "AWS_SECRET_ACCESS_KEY"
          value = var.aws_secret_access_key
        },
        {
          name  = "AWS_DEFAULT_REGION"
          value = var.region
        },
        {
          name  = "AWS_ACCOUNT_NAME"
          value = var.domain
        },
        {
          name = "UI_SECRET_NAME"
          value = var.ui_secret_name
        },
        {
          name = "API_SECRET_NAME"
          value = var.api_secret_name
        },
        {
          name = "API_BUCKET_NAME"
          value = var.api_bucket_name
        },
        {
          name = "AWS_ENVIRONMENT"
          value = var.aws_environment
        },
        {
          name = "LOCALHOST"
          value = var.localhost
        }
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-create-group"  = "true",
          "awslogs-group"         = "/ecs/ecs-service-${var.service_subdomain}-application",
          "awslogs-region"        = "${var.region}",
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
  execution_role_arn       = "arn:aws:iam::${var.aws_account_id}:role/ecsTaskExecutionRole"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.service_cpu
  memory                   = var.service_memory
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

}
resource "aws_ecs_service" "application" {
  name             = "${var.service_subdomain}-service"
  cluster          = data.terraform_remote_state.ecs_infrastructure.outputs.ecs_cluster_id
  task_definition  = aws_ecs_task_definition.ecs_service_definition.arn
  desired_count    = var.task_count
  launch_type      = "FARGATE"
  platform_version = "LATEST"

  force_new_deployment               = var.force_deployment
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  enable_ecs_managed_tags = true # It will tag the network interface with service name
  wait_for_steady_state   = true # Terraform will wait for the service to reach a steady state before continuing

  load_balancer {
    target_group_arn = aws_lb_target_group.tech_audit_tool_fargate_tg.arn
    container_name   = "${var.service_subdomain}-task-application"
    container_port   = var.container_port
  }

  # We need to wait until the target group is attached to the listener
  # and also the load balancer so we wait until the listener creation
  # is complete first
  network_configuration {
    subnets         = data.terraform_remote_state.ecs_infrastructure.outputs.private_subnets
    security_groups = [aws_security_group.allow_rules_service.id]

    # TODO: The container fails to launch unless a public IP is assigned
    # For a private ip, you would need to use a NAT Gateway?
    assign_public_ip = true
  }

}