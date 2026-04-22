variable "zone_id" {
  description = "Route 53 Hosted Zone ID"
  type        = string
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name ALB (z modułu alb)"
  type        = string
}

variable "alb_zone_id" {
  description = "Zone ID ALB (z modułu alb)"
  type        = string
}