# Appointment Scheduling System API Documentation

## Overview

This document provides comprehensive documentation for the HIPAA-compliant appointment scheduling system with email notifications.

## Features

- **Doctor Availability Management**: Doctors can set weekly availability, breaks, and exceptions
- **Patient Booking**: Patients can view available slots and book appointments
- **Appointment Management**: Reschedule, cancel, and track appointment status
- **HIPAA-Compliant Notifications**: Secure email notifications via AWS SES
- **Audit Logging**: Complete audit trail for compliance
- **Role-Based Access**: Separate permissions for doctors and patients

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Doctor Availability

#### Set Doctor Availability
```http
POST /api/doctors/availability
Content-Type: application/json
Authorization: Bearer <doctor-token>

{
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "17:00",
  "slot_duration": 30,
  "effective_from": "2024-01-01T00:00:00Z",
  "effective_to": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "Availability set successfully"
}
```

#### Get Doctor Availability
```http
GET /api/doctors/availability
Authorization: Bearer <doctor-token>
```

**Response:**
```json
{
  "availabilities": [
    {
      "id": 1,
      "doctor_id": 5,
      "day_of_week": "Monday",
      "start_time": "09:00",
      "end_time": "17:00",
      "slot_duration": 30,
      "is_active": true,
      "effective_from": "2024-01-01T00:00:00Z",
      "effective_to": "2024-12-31T23:59:59Z"
    }
  ]
}
```

#### Get Available Slots
```http
GET /api/doctors/5/slots?date=2024-01-15
Authorization: Bearer <patient-token>
```

**Response:**
```json
{
  "slots": [
    {
      "start_time": "2024-01-15T09:00:00Z",
      "end_time": "2024-01-15T09:30:00Z",
      "duration": 30,
      "doctor_id": 5
    },
    {
      "start_time": "2024-01-15T09:30:00Z",
      "end_time": "2024-01-15T10:00:00Z",
      "duration": 30,
      "doctor_id": 5
    }
  ]
}
```

### Appointment Management

#### Book Appointment
```http
POST /api/appointments
Content-Type: application/json
Authorization: Bearer <patient-token>

{
  "doctor_id": 5,
  "appointment_type": "consultation",
  "scheduled_at": "2024-01-15T09:00:00Z",
  "duration": 30,
  "notes": "Regular checkup"
}
```

**Response:**
```json
{
  "appointment": {
    "id": 123,
    "patient_id": 10,
    "doctor_id": 5,
    "appointment_type": "consultation",
    "status": "scheduled",
    "scheduled_at": "2024-01-15T09:00:00Z",
    "duration": 30,
    "notes": "Regular checkup",
    "patient": {
      "id": 10,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    },
    "doctor": {
      "id": 5,
      "first_name": "Dr. Sarah",
      "last_name": "Smith",
      "email": "dr.smith@clinic.com"
    },
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

#### Get Appointment
```http
GET /api/appointments/123
Authorization: Bearer <patient-or-doctor-token>
```

**Response:**
```json
{
  "appointment": {
    "id": 123,
    "patient_id": 10,
    "doctor_id": 5,
    "appointment_type": "consultation",
    "status": "scheduled",
    "scheduled_at": "2024-01-15T09:00:00Z",
    "duration": 30,
    "notes": "Regular checkup",
    "patient": {
      "id": 10,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    },
    "doctor": {
      "id": 5,
      "first_name": "Dr. Sarah",
      "last_name": "Smith",
      "email": "dr.smith@clinic.com"
    }
  }
}
```

#### Reschedule Appointment
```http
PUT /api/appointments/123/reschedule
Content-Type: application/json
Authorization: Bearer <patient-or-doctor-token>

{
  "new_scheduled_at": "2024-01-16T10:00:00Z",
  "reason": "Patient requested different time"
}
```

**Response:**
```json
{
  "appointment": {
    "id": 123,
    "scheduled_at": "2024-01-16T10:00:00Z",
    "status": "scheduled",
    "updated_at": "2024-01-10T15:00:00Z"
  }
}
```

#### Cancel Appointment
```http
PUT /api/appointments/123/cancel
Content-Type: application/json
Authorization: Bearer <patient-or-doctor-token>

{
  "reason": "Patient is feeling better"
}
```

**Response:**
```json
{
  "message": "Appointment canceled successfully"
}
```

#### Get Notification History
```http
GET /api/appointments/123/notifications
Authorization: Bearer <patient-or-doctor-token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "appointment_id": 123,
      "notification_type": "confirmation",
      "status": "sent",
      "subject": "Appointment Confirmed",
      "sent_at": "2024-01-10T10:01:00Z"
    },
    {
      "id": 2,
      "appointment_id": 123,
      "notification_type": "reschedule",
      "status": "sent",
      "subject": "Appointment Rescheduled",
      "sent_at": "2024-01-10T15:01:00Z"
    }
  ]
}
```

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Testing with cURL

### 1. Doctor Sets Availability
```bash
curl -X POST http://localhost:8080/api/doctors/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <doctor-token>" \
  -d '{
    "day_of_week": "Monday",
    "start_time": "09:00",
    "end_time": "17:00",
    "slot_duration": 30,
    "effective_from": "2024-01-01T00:00:00Z",
    "effective_to": "2024-12-31T23:59:59Z"
  }'
```

### 2. Patient Views Available Slots
```bash
curl -X GET "http://localhost:8080/api/doctors/5/slots?date=2024-01-15" \
  -H "Authorization: Bearer <patient-token>"
```

### 3. Patient Books Appointment
```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient-token>" \
  -d '{
    "doctor_id": 5,
    "appointment_type": "consultation",
    "scheduled_at": "2024-01-15T09:00:00Z",
    "duration": 30,
    "notes": "Regular checkup"
  }'
```

### 4. Reschedule Appointment
```bash
curl -X PUT http://localhost:8080/api/appointments/123/reschedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient-token>" \
  -d '{
    "new_scheduled_at": "2024-01-16T10:00:00Z",
    "reason": "Patient requested different time"
  }'
```

## Data Models

### Appointment Status Values
- `scheduled`: Initial state when appointment is booked
- `confirmed`: Doctor/system has confirmed the appointment
- `in-progress`: Appointment is currently happening
- `completed`: Appointment finished successfully
- `canceled`: Appointment was canceled
- `no-show`: Patient didn't show up
- `rescheduled`: Appointment was moved to a different time

### Appointment Types
- `consultation`: General consultation
- `follow-up`: Follow-up appointment
- `therapy`: Therapy session
- `emergency`: Emergency appointment

### Day of Week Values
- `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

### Notification Types
- `confirmation`: Appointment confirmation
- `reminder`: Appointment reminder (sent 24h before)
- `reschedule`: Appointment reschedule notification
- `cancellation`: Appointment cancellation notification

## HIPAA Compliance Features

1. **Data Minimization**: Email notifications only include non-PHI data (first names, appointment times)
2. **Audit Logging**: All appointment actions are logged with user, timestamp, IP address
3. **Access Control**: Users can only access their own appointments
4. **Secure Communications**: All data transmission via HTTPS
5. **Email Masking**: Email addresses are masked in application logs
6. **Encryption**: Sensitive data encrypted at rest and in transit

## AWS SES Setup

1. Verify your domain or email address in AWS SES
2. Request production access if needed (starts in sandbox mode)
3. Configure AWS credentials in your environment
4. Update the `fromEmail` variable in the integration code

## Environment Variables

Required environment variables:
```bash
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Email Configuration
FROM_EMAIL=noreply@yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=healthcare_db

# JWT Configuration
JWT_SECRET=your-secret-key
```

## Database Migration

Run the following SQL to create the necessary tables:

```sql
-- This will be auto-created by GORM AutoMigrate
-- Just ensure your models are properly defined
```

Or use GORM's AutoMigrate in your application startup:

```go
db.AutoMigrate(
    &models.Appointment{},
    &models.DoctorAvailability{},
    &models.DoctorBreak{},
    &models.DoctorException{},
    &models.AppointmentAuditLog{},
    &models.NotificationRecord{},
)
```

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for API endpoints
2. **Monitoring**: Set up monitoring for email delivery and API performance
3. **Backup**: Regular database backups for appointment data
4. **Scaling**: Consider read replicas for high-traffic scenarios
5. **Caching**: Cache doctor availability data for better performance
6. **Queue Processing**: Use message queues for email notifications in high-volume scenarios
7. **Health Checks**: Implement health check endpoints for load balancers
8. **Logging**: Structured logging with correlation IDs for request tracing

