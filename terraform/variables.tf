variable "digitalocean_token" {
  description = "DigitalOcean API token. Set via terraform.tfvars or the DIGITALOCEAN_TOKEN environment variable."
  type        = string
  sensitive   = true
  default     = null
}

variable "droplet_name" {
  description = "Name of the DigitalOcean droplet."
  type        = string
  default     = "docker-host"
}

variable "region" {
  description = "DigitalOcean region slug."
  type        = string
  default     = "fra1"
}

variable "size" {
  description = "DigitalOcean droplet size slug."
  type        = string
  default     = "s-1vcpu-1gb"
}

variable "image" {
  description = "Ubuntu image slug used for the droplet."
  type        = string
  default     = "ubuntu-22-04-x64"
}

variable "ssh_public_key" {
  description = "SSH public key contents to register in DigitalOcean and install on the droplet."
  type        = string
}

variable "tags" {
  description = "Tags assigned to the droplet."
  type        = list(string)
  default     = ["docker", "terraform"]
}
