variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "skypulse"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "Existing VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnets for the ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnets for the ECS service"
  type        = list(string)
}

variable "ecs_execution_role_arn" {
  description = "IAM role ARN used by ECS to pull images and write logs"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "IAM role ARN attached to the running task"
  type        = string
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "container_port" {
  description = "Application container port"
  type        = number
  default     = 3000
}

variable "task_cpu" {
  description = "Fargate CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}
