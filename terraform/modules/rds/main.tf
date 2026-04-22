resource "aws_db_subnet_group" "main" {
  name       = "goexplore-db-subnet"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "rds" {
  name   = "goexplore-rds-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks = [var.vpc_cidr]  
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier        = "goexplore-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t4g.micro"  # najtańsza opcja
  allocated_storage = 20

  db_name  = "goexplore"
  username = "goexplore_user"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Oszczędności
  publicly_accessible     = false  # niedostępna z internetu
  skip_final_snapshot     = true   # usuń snapshot przy destroy
  backup_retention_period = 1      # minimum backupów
  multi_az                = false  # bez redundancji = taniej

  tags = { Name = "goexplore-db" }
}