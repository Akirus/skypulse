# Terraform

This directory provisions a single small DigitalOcean droplet prepared to run Docker.

## Requirements

- Terraform 1.2+
- A DigitalOcean API token provided as `TF_VAR_digitalocean_token`
- An SSH public key to register in DigitalOcean for later SSH access to the droplet

## Usage

```bash
cd terraform
terraform init
terraform validate
terraform plan
```

Copy `terraform.tfvars.example` to `terraform.tfvars` and adjust values.

## Generate SSH Keys

```bash
ssh-keygen -t ed25519 -C "your-email@example.com" -f ./id_ed25519
```

This creates:

- Private key: `terraform/id_ed25519`
- Public key: `terraform/id_ed25519.pub`

Add the public key contents to `ssh_public_key` in `terraform.tfvars`. Keep the private key in this folder locally and do not commit it.

You can inspect the public key with:

```bash
cat ./id_ed25519.pub
```

Set `ssh_public_key` to the full contents of your public key, for example the contents of `./id_ed25519.pub`.

After `terraform apply`, connect with:

```bash
ssh -i ./id_ed25519 root@<droplet_ip>
```

