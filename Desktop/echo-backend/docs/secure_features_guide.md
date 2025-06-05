# Secure Features Implementation Guide

## Overview

This guide covers the implementation of three critical secure features for the mental health platform:

1. **Secure Notes**: Application-level encrypted doctor's notes with HIPAA compliance
2. **Video Call Integration**: BAA-compliant Twilio integration with short-lived tokens
3. **Payment Integration**: BAA-compliant Stripe integration with secure webhook handling

## 1. Secure Notes with Application-Level Encryption

### Architecture

- **Encryption**: AES-256-GCM with application-level key management
- **Key Rotation**: Support for multiple encryption keys with key IDs
- **Audit Logging**: Complete audit trail for all note access and modifications
- **Access Control**: Role-based access with mandatory access reasons

### Key Components

#### Encryption Service (`pkg/encryption/aes_encryption.go`)
- AES-256-GCM encryption with nonce-based security
- Content integrity verification with SHA-256 hashes
- Key rotation support with unique key identifiers
- Secure key derivation using master key + key ID

#### Models (`internal/models/secure_note.go`)
- `SecureNote`: Encrypted note storage with metadata
- `SecureNoteAuditLog`: Comprehensive audit logging
- Request/response models with validation

#### Security Features
- **Content Masking**: Sensitive content masked in audit logs
- **Access Reasons**: Mandatory justification for accessing notes
- **IP/User Agent Tracking**: Complete access tracking
- **Integrity Verification**: Content hash validation on decryption

### API Endpoints

```bash
# Create encrypted note (doctors only)
POST /api/secure-notes
{
  "appointment_id": 123,
  "content": "Patient showed significant improvement...",
  "note_type": "progress",
  "access_reason": "Creating progress note for session"
}

# Access encrypted note (requires reason)
POST /api/secure-notes/456/access
{
  "access_reason": "Reviewing patient history for follow-up"
}

# Update encrypted note
PUT /api/secure-notes/456
{
  "content": "Updated content...",
  "note_type": "progress",
  "access_reason": "Correcting previous note"
}

# Get notes by appointment
POST /api/appointments/123/secure-notes/access
{
  "access_reason": "Preparing for appointment"
}

# Archive note
PUT /api/secure-notes/456/archive
{
  "access_reason": "Note no longer relevant"
}

# Get audit logs
GET /api/secure-notes/456/audit-logs
```

### Environment Variables

```bash
# Master encryption key (32 bytes base64 encoded)
ENCRYPTION_MASTER_KEY=your-base64-encoded-32-byte-key

# Generate a master key (run once during setup)
go run -c 'import "backend/pkg/encryption"; key, _ := encryption.GenerateMasterKey(); fmt.Println(key)'
```

### HIPAA Compliance Features

1. **Data Minimization**: Only necessary data is encrypted and stored
2. **Access Logging**: Every access is logged with reason and user details
3. **Content Masking**: Sensitive content is masked in logs and audit trails
4. **Integrity Verification**: Content integrity is verified on every access
5. **Key Management**: Secure key rotation and derivation

## 2. Video Call Integration with Twilio

### Architecture

- **Short-lived Tokens**: 1-hour expiration for security
- **Room Management**: Automatic room creation and cleanup
- **Audit Logging**: Complete session tracking
- **Webhook Processing**: Real-time status updates from Twilio

### Key Components

#### Twilio Service (`pkg/twilio/video_service.go`)
- JWT token generation for Twilio access
- Room creation and management
- Participant management
- Webhook signature validation

#### Models (`internal/models/video_call.go`)
- `VideoCallSession`: Video call session management
- `VideoCallParticipant`: Participant tracking with tokens
- `VideoCallAuditLog`: Complete audit trail

### API Endpoints

```bash
# Create video call session
POST /api/video-calls
{
  "appointment_id": 123,
  "recording_enabled": true
}

# Get access token for participant
POST /api/video-calls/tokens
{
  "session_id": 456
}

# Start video call
POST /api/video-calls/456/start

# End video call
POST /api/video-calls/456/end

# Get session info
GET /api/video-calls/456

# Get all sessions for appointment
GET /api/appointments/123/video-calls

# Webhook endpoint for Twilio events
POST /api/webhooks/twilio/video
```

### Frontend Integration

```javascript
// 1. Create video call session
const sessionResponse = await fetch('/api/video-calls', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    appointment_id: 123,
    recording_enabled: true
  })
});
const session = await sessionResponse.json();

// 2. Get access token
const tokenResponse = await fetch('/api/video-calls/tokens', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    session_id: session.id
  })
});
const { access_token, room_name } = await tokenResponse.json();

// 3. Connect to Twilio Video
import { connect } from 'twilio-video';
const room = await connect(access_token, {
  name: room_name,
  audio: true,
  video: true
});
```

### Environment Variables

```bash
# Twilio credentials
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_API_KEY=your-api-key
TWILIO_API_SECRET=your-api-secret
```

### Security Features

1. **Short-lived Tokens**: 1-hour expiration prevents token abuse
2. **Identity Management**: Unique identities for each participant
3. **Room Isolation**: Each appointment gets its own room
4. **Access Control**: Only appointment participants can join
5. **Audit Trail**: Complete logging of all video call activities

## 3. Payment Integration with Stripe

### Architecture

- **Secure Webhooks**: Signature verification for all webhook events
- **PCI Compliance**: No sensitive payment data stored locally
- **Audit Logging**: Complete payment activity tracking
- **Refund Management**: Secure refund processing

### Key Components

#### Stripe Service (`pkg/stripe/payment_service.go`)
- Payment Intent creation and management
- Customer management
- Refund processing
- Webhook signature validation

#### Models (`internal/models/payment.go`)
- `Payment`: Payment transaction tracking
- `PaymentRefund`: Refund management
- `PaymentAuditLog`: Complete audit trail

### API Endpoints

```bash
# Create payment intent
POST /api/payments
{
  "appointment_id": 123,
  "amount": 15000,  // $150.00 in cents
  "currency": "USD",
  "description": "Mental health consultation"
}

# Get payment
GET /api/payments/456

# Create refund
POST /api/payments/456/refunds
{
  "amount": 5000,  // $50.00 partial refund
  "reason": "Session ended early"
}

# Get payments for appointment
GET /api/appointments/123/payments

# Webhook endpoint for Stripe events
POST /api/webhooks/stripe
```

### Frontend Integration

```javascript
// 1. Create payment intent
const paymentResponse = await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    appointment_id: 123,
    amount: 15000,  // $150.00
    currency: 'USD',
    description: 'Mental health consultation'
  })
});
const { client_secret } = await paymentResponse.json();

// 2. Process payment with Stripe Elements
import { loadStripe } from '@stripe/stripe-js';
const stripe = await loadStripe('pk_test_...');

const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  clientSecret: client_secret,
  confirmParams: {
    return_url: 'https://your-app.com/payment-success'
  }
});
```

### Environment Variables

```bash
# Stripe credentials
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key  # For frontend
```

### Webhook Event Handling

```bash
# Supported Stripe webhook events
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
charge.dispute.created
refund.created
refund.updated
```

### Security Features

1. **Webhook Verification**: All webhooks verified with Stripe signatures
2. **PCI Compliance**: No card data stored locally
3. **Audit Logging**: All payment activities logged
4. **Amount Validation**: Server-side amount verification
5. **Refund Controls**: Secure refund processing with limits

## Integration with Existing System

### Database Migrations

```go
// Add to your migration
db.AutoMigrate(
    // Secure Notes
    &models.SecureNote{},
    &models.SecureNoteAuditLog{},
    
    // Video Calls
    &models.VideoCallSession{},
    &models.VideoCallParticipant{},
    &models.VideoCallAuditLog{},
    
    // Payments
    &models.Payment{},
    &models.PaymentRefund{},
    &models.PaymentAuditLog{},
)
```

### Service Integration

```go
// In your main.go or service setup
func setupSecureFeatures(db *gorm.DB, logger *logger.Logger) {
    // Initialize encryption service
    encryptionService, err := encryption.NewEncryptionService()
    if err != nil {
        log.Fatal("Failed to initialize encryption service:", err)
    }
    
    // Initialize Twilio service
    twilioService, err := twilio.NewVideoService(logger)
    if err != nil {
        log.Fatal("Failed to initialize Twilio service:", err)
    }
    
    // Initialize Stripe service
    stripeService, err := stripe.NewPaymentService(logger)
    if err != nil {
        log.Fatal("Failed to initialize Stripe service:", err)
    }
    
    // Initialize repositories
    secureNoteRepo := repository.NewSecureNoteRepository(db)
    videoCallRepo := repository.NewVideoCallRepository(db)
    paymentRepo := repository.NewPaymentRepository(db)
    
    // Initialize services
    secureNoteService := services.NewSecureNoteService(
        secureNoteRepo, appointmentRepo, userRepo, encryptionService, logger)
    videoCallService := services.NewVideoCallService(
        videoCallRepo, appointmentRepo, userRepo, twilioService, logger)
    paymentService := services.NewPaymentService(
        paymentRepo, appointmentRepo, userRepo, stripeService, logger)
    
    // Initialize handlers
    secureNoteHandler := handlers.NewSecureNoteHandler(secureNoteService, logger)
    videoCallHandler := handlers.NewVideoCallHandler(videoCallService, logger)
    paymentHandler := handlers.NewPaymentHandler(paymentService, logger)
    
    // Setup routes
    setupSecureNoteRoutes(router, secureNoteHandler, authMiddleware)
    setupVideoCallRoutes(router, videoCallHandler, authMiddleware)
    setupPaymentRoutes(router, paymentHandler, authMiddleware)
}
```

### Environment Configuration

```bash
# Complete environment variables needed

# Encryption
ENCRYPTION_MASTER_KEY=your-32-byte-base64-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_API_KEY=your-api-key
TWILIO_API_SECRET=your-api-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=healthcare_db

# JWT
JWT_SECRET=your-jwt-secret
```

## Testing

### Secure Notes Testing

```bash
# Test encryption/decryption
curl -X POST http://localhost:8080/api/secure-notes \
  -H "Authorization: Bearer doctor-token" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "content": "Patient shows improvement in anxiety levels",
    "note_type": "progress",
    "access_reason": "Creating session notes"
  }'

# Test note access
curl -X POST http://localhost:8080/api/secure-notes/1/access \
  -H "Authorization: Bearer doctor-token" \
  -H "Content-Type: application/json" \
  -d '{
    "access_reason": "Reviewing for follow-up appointment"
  }'
```

### Video Call Testing

```bash
# Test session creation
curl -X POST http://localhost:8080/api/video-calls \
  -H "Authorization: Bearer doctor-token" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "recording_enabled": true
  }'

# Test token generation
curl -X POST http://localhost:8080/api/video-calls/tokens \
  -H "Authorization: Bearer patient-token" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": 1
  }'
```

### Payment Testing

```bash
# Test payment intent creation
curl -X POST http://localhost:8080/api/payments \
  -H "Authorization: Bearer patient-token" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "amount": 15000,
    "currency": "USD",
    "description": "Mental health consultation"
  }'

# Test refund creation
curl -X POST http://localhost:8080/api/payments/1/refunds \
  -H "Authorization: Bearer doctor-token" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "reason": "Session ended early"
  }'
```

## Production Considerations

### Security
1. **Key Management**: Use AWS KMS or similar for encryption key management in production
2. **Network Security**: Ensure all communications use HTTPS/TLS
3. **Access Logging**: Monitor all access to sensitive data
4. **Rate Limiting**: Implement rate limiting on all endpoints
5. **Input Validation**: Validate all inputs thoroughly

### Compliance
1. **HIPAA**: All features designed for HIPAA compliance
2. **BAA**: Ensure Business Associate Agreements with Twilio and Stripe
3. **Audit Trails**: Maintain complete audit logs for compliance reviews
4. **Data Retention**: Implement data retention policies
5. **Backup/Recovery**: Secure backup and recovery procedures

### Monitoring
1. **Health Checks**: Implement health checks for all external services
2. **Alerting**: Set up alerts for service failures and security events
3. **Metrics**: Track usage metrics and performance
4. **Logging**: Structured logging with correlation IDs
5. **Error Tracking**: Comprehensive error tracking and reporting

### Scaling
1. **Database**: Consider read replicas for high-traffic scenarios
2. **Caching**: Cache frequently accessed data
3. **Load Balancing**: Use load balancers for high availability
4. **CDN**: Use CDN for static assets
5. **Microservices**: Consider splitting into microservices if needed

This implementation provides a secure, compliant, and scalable foundation for handling sensitive healthcare data, video communications, and payment processing.

