output "db_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Adres bazy danych np. goexplore-db.xxx.eu-north-1.rds.amazonaws.com:5432"
}