# Mental Health Platform Backend Makefile

.PHONY: help build run test clean docker-up docker-down deps lint fmt

# Default target
help: ## Show this help message
	@echo "Mental Health Platform Backend - Available Commands:"
	@echo
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
build: ## Build the application
	@echo "🔨 Building application..."
	go build -o bin/server cmd/server/main.go
	@echo "✅ Build complete!"

run: ## Run the application
	@echo "🚀 Starting application..."
	go run cmd/server/main.go

dev: ## Run with hot reload (requires air)
	@echo "🔥 Starting with hot reload..."
	air

test: ## Run tests
	@echo "🧪 Running tests..."
	go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Database commands
docker-up: ## Start PostgreSQL database
	@echo "🐳 Starting PostgreSQL database..."
	docker-compose up -d postgres
	@echo "✅ Database started on localhost:5432"

docker-down: ## Stop database
	@echo "🛑 Stopping database..."
	docker-compose down

docker-logs: ## View database logs
	docker-compose logs -f postgres

db-connect: ## Connect to database
	docker exec -it mental-health-postgres psql -U postgres -d mental_health_platform

# Code quality commands
deps: ## Download dependencies
	@echo "📦 Downloading dependencies..."
	go mod download
	go mod tidy

lint: ## Run linter
	@echo "🔍 Running linter..."
	golangci-lint run

fmt: ## Format code
	@echo "🎨 Formatting code..."
	go fmt ./...
	goimports -w .

# Security commands
sec-scan: ## Run security scan
	@echo "🔒 Running security scan..."
	gosec ./...

vuln-check: ## Check for vulnerabilities
	@echo "🛡️ Checking for vulnerabilities..."
	govulncheck ./...

# API testing commands
api-test: ## Test API endpoints (requires running server)
	@echo "🧪 Testing API endpoints..."
	./test_api.sh

# Setup commands
setup: deps docker-up ## Setup development environment
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	@echo "🎉 Development environment setup complete!"
	@echo "📖 Run 'make run' to start the server"
	@echo "🧪 Run 'make api-test' to test the API"

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
	rm -f coverage.out coverage.html

# Docker commands for full application
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t mental-health-platform .

docker-run: ## Run application in Docker
	@echo "🚀 Running application in Docker..."
	docker run -p 8080:8080 --env-file .env mental-health-platform

# Production helpers
prod-build: ## Build for production
	@echo "🏭 Building for production..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-w -s' -o bin/server cmd/server/main.go

gen-jwt-secret: ## Generate a secure JWT secret
	@echo "🔐 Generated JWT Secret:"
	@openssl rand -base64 64

gen-password: ## Generate a secure password
	@echo "🔑 Generated Password:"
	@openssl rand -base64 32

# Help for environment setup
env-help: ## Show environment setup help
	@echo "📋 Environment Setup:"
	@echo
	@echo "1. Copy .env file and update values:"
	@echo "   cp .env .env.local"
	@echo
	@echo "2. Update these required values in .env:"
	@echo "   - DB_USER=postgres"
	@echo "   - DB_PASSWORD=password"
	@echo "   - DB_NAME=mental_health_platform"
	@echo "   - JWT_SECRET=<generate with 'make gen-jwt-secret'>"
	@echo
	@echo "3. Start development:"
	@echo "   make setup"
	@echo "   make run"

info: ## Show project information
	@echo "🏥 Mental Health Platform Backend"
	@echo "📋 HIPAA-Compliant Authentication System"
	@echo
	@echo "🔐 Features:"
	@echo "  • JWT Authentication"
	@echo "  • Role-Based Access Control (RBAC)"
	@echo "  • Secure Password Hashing (bcrypt)"
	@echo "  • Comprehensive Audit Logging"
	@echo "  • Session Management"
	@echo "  • Security Headers"
	@echo
	@echo "👥 User Roles:"
	@echo "  • Patient: Personal health data access"
	@echo "  • Doctor: Patient data access (authorized)"
	@echo "  • Admin: Full system administration"
	@echo
	@echo "📚 Documentation: README.md"
	@echo "🧪 API Testing: make api-test"
	@echo "🏃 Quick Start: make setup && make run"

