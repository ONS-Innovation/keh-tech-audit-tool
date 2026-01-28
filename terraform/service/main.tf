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
      healthCheck = {
        command     = ["CMD-SHELL", "python -c 'import urllib.request; urllib.request.urlopen(\"http://127.0.0.1:8000/health\", timeout=4)' || exit 1"]
        interval    = 300   # seconds between checks
        timeout     = 5     # seconds before considering the check failed
        retries     = 3     # consecutive failures before marking unhealthy
        startPeriod = 20    # warm-up before health checks count
      },
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



# Cloudwatch metric filter which checks if the backend health check endpoint is called, if so return 0, else add 1 to current failure count
resource "aws_cloudwatch_log_metric_filter" "Health_check_filter" {
  name           = "TAT_UI_health_check_filter"
  pattern        = "[ip, ident, user, timestamp, request=\"GET /health HTTP/1.1\", status=200, bytes, referrer, agent]" # Filters out to ensure that the health check is called and a 200 status code is recieved
  log_group_name = aws_cloudwatch_log_group.ecs_service_logs.name

  metric_transformation {
    name          = "HealthCheckFailureCount"
    namespace     = "ECS/ContainerInsights"
    value         = "0"
    default_value = "1"
  }
}


# Cloudwatch alarm that sounds when we have >0 health checks fail, or if there is no data every 5 minutes, it sounds
resource "aws_cloudwatch_metric_alarm" "Health_check_alarm" {
  alarm_name          = "TAT_UI_health_alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckFailureCount"
  namespace           = "ECS/ContainerInsights"
  period              = 600
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarm when ECS service has unhealthy tasks"
  treat_missing_data  = "breaching"
}