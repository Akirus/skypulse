output "droplet_id" {
  description = "DigitalOcean droplet ID."
  value       = digitalocean_droplet.docker_host.id
}

output "droplet_ipv4_address" {
  description = "Public IPv4 address assigned to the droplet."
  value       = digitalocean_droplet.docker_host.ipv4_address
}
