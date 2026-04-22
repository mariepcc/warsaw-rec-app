variable "domain_name" {
  type        = string
  description = "Root domain name, np. twoja-domena.com"
}

variable "zone_id" {
  type        = string
  description = "Route 53 Hosted Zone ID (z modułu dns)"
}