# Mental Health Platform Backend

A HIPAA-compliant backend API for a mental health platform built with Go, featuring secure user authentication, role-based access control, and comprehensive audit logging.

## 🔐 Security Features

- **HIPAA Compliance**: Built with healthcare data protection in mind
- **JWT Authentication**: Stateless token-based authentication
- **Role-Based Access Control (RBAC)**: Separate permissions for patients, doctors, and admins
- **Password Security**: Strong password requirements with bcrypt hashing
- **Audit Logging**: Complete audit trail for all PHI access and security events
- **Session Management**: Secure session tracking and revocation
- **Security Headers**: Comprehensive security headers for production deployment

## 🏗️ Architecture

```
├── cmd/server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── database/        # Database connection and migrations
│   ├── handlers/        # HTTP request handlers
│   ├── middleware/      # Authentication and RBAC middleware
│   ├── models/          # Data models and DTOs
│   ├── repository/      # Data access layer
│   └── services/        # Business logic layer
├── pkg/
│   ├── auth/           # JWT and password utilities
│   └── logger/         # Structured logging
└── .env                # Environment configuration
```

## 🚀 Quick Start

### Prerequisites

- Go 1.21+
- PostgreSQL 12+
- Git

### 1. Setup Database

```bash
# Create PostgreSQL database
createdb mental_health_platform

# Or using Docker
docker run --name postgres-mhp \
  -e POSTGRES_DB=mental_health_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env

# Update database connection and JWT secret
vim .env
```

### 3. Install Dependencies

```bash
go mod tidy
```

### 4. Run the Application

```bash
# Run with auto-reload (development)
go run cmd/server/main.go

# Or build and run
go build -o bin/server cmd/server/main.go
./bin/server
```

The server will start on `http://localhost:8080`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "role": "patient",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePass123!"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <jwt_token>
```

### User Profile Endpoints

#### Get Current User Profile
```http
GET /api/v1/users/me
Authorization: Bearer <jwt_token>
```

#### Update User Profile
```http
PUT /api/v1/users/me
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "country": "USA"
}
```

#### Change Password
```http
PUT /api/v1/users/me/password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "old_password": "OldSecurePass123!",
  "new_password": "NewSecurePass123!"
}
```

### Health Check
```http
GET /health
```

## 🔑 User Roles

- **Patient**: Can manage their own profile and access patient-specific features
- **Doctor**: Can access doctor-specific features and patient data (with proper authorization)
- **Admin**: Full system access for user management and system administration

## 🛡️ Security Considerations

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

### JWT Token
- 24-hour expiration (configurable)
- Includes user ID, email, and role
- Signed with HMAC-SHA256

### Security Headers
- `Strict-Transport-Security`: HTTPS enforcement
- `X-Content-Type-Options`: MIME type sniffing protection
- `X-Frame-Options`: Clickjacking protection
- `Content-Security-Policy`: XSS protection
- `Cache-Control`: Prevents sensitive data caching

## 📊 Audit Logging

All security events and PHI access are logged with:
- User identification
- Action performed
- Resource accessed
- IP address
- User agent
- Timestamp

Logged events include:
- User registration
- Login attempts (successful and failed)
- Password changes
- Profile updates
- PHI access
- Unauthorized access attempts

## 🧪 Testing

### Example curl requests:

```bash
# Register a patient
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!",
    "role": "patient",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!"
  }'

# Get profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer TOKEN"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | Required |
| `DB_PASSWORD` | Database password | Required |
| `DB_NAME` | Database name | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRY_HOURS` | JWT expiration time | `24` |
| `PORT` | Server port | `8080` |
| `GIN_MODE` | Gin framework mode | `debug` |
| `BCRYPT_COST` | Password hashing cost | `12` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FORMAT` | Log format (json/console) | `json` |

## 📁 Database Schema

### Tables
- `users` - User accounts
- `user_profiles` - User personal information (PHI)
- `doctor_profiles` - Additional doctor information
- `audit_logs` - Security and access audit trail
- `user_sessions` - Active user sessions

## 🚀 Production Deployment

1. **Set strong JWT secret**: Use a cryptographically secure random string
2. **Configure HTTPS**: Use TLS certificates for all communications
3. **Database security**: Use connection pooling and encrypted connections
4. **Environment variables**: Never commit secrets to version control
5. **Monitoring**: Set up logging aggregation and monitoring
6. **Backup**: Implement regular database backups
7. **CORS**: Configure appropriate CORS settings for your frontend

## 🤝 Contributing

1. Follow Go coding standards
2. Add tests for new functionality
3. Update documentation
4. Ensure HIPAA compliance for any PHI-related changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a development template. For production use in healthcare environments, ensure proper HIPAA compliance review, security auditing, and legal consultation.

