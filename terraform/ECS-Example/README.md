# ECS Example

This directory contains an intentionally incomplete Terraform example for deploying the app to AWS ECS behind an Application Load Balancer.

It is included as a reference only for the take-home task. It is not intended to be applied directly without adapting:

- AWS account and VPC identifiers
- IAM roles and policies
- image registry and tagging strategy
- secrets handling
- autoscaling configuration
- logging, monitoring, and alarms

The example assumes:

- ECS Fargate
- one public ALB
- one ECS service
- one target group
- an existing VPC and existing subnets

Files:

- `main.tf`: sample ECS, ALB, security group, and log group resources
- `variables.tf`: example inputs
- `terraform.tfvars.example`: example variable values

This is a sketch to demonstrate direction, not a production-ready module.
