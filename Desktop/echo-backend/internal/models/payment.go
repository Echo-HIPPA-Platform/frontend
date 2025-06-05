package models

import (
	"fmt"
	"time"
	"gorm.io/gorm"
)

// Payment represents a payment transaction
type Payment struct {
	ID                uint          `json:"id" gorm:"primaryKey"`
	AppointmentID     uint          `json:"appointment_id" gorm:"not null;index"`
	PatientID         uint          `json:"patient_id" gorm:"not null;index"`
	StripePaymentID   string        `json:"-" gorm:"size:100;unique;index"` // Stripe Payment Intent ID (hidden)
	StripeCustomerID  string        `json:"-" gorm:"size:100;index"`        // Stripe Customer ID (hidden)
	Amount            int64         `json:"amount"`                          // Amount in cents
	Currency          string        `json:"currency" gorm:"size:3;default:USD"`
	Status            PaymentStatus `json:"status" gorm:"size:20;not null"`
	Description       string        `json:"description" gorm:"size:500"`
	FailureReason     string        `json:"-" gorm:"size:500"` // Hidden from JSON for security
	RefundedAmount    int64         `json:"refunded_amount,omitempty" gorm:"default:0"`
	ProcessedAt       *time.Time    `json:"processed_at,omitempty"`
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Appointment   Appointment       `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
	Patient       User              `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	AuditLogs     []PaymentAuditLog `json:"-" gorm:"foreignKey:PaymentID"`
	Refunds       []PaymentRefund   `json:"refunds,omitempty" gorm:"foreignKey:PaymentID"`
}

// PaymentStatus represents the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"    // Payment intent created
	PaymentStatusProcessing PaymentStatus = "processing" // Payment being processed
	PaymentStatusSucceeded PaymentStatus = "succeeded"  // Payment completed successfully
	PaymentStatusFailed    PaymentStatus = "failed"     // Payment failed
	PaymentStatusCanceled  PaymentStatus = "canceled"   // Payment was canceled
	PaymentStatusRefunded  PaymentStatus = "refunded"   // Payment was refunded (fully)
	PaymentStatusPartiallyRefunded PaymentStatus = "partially_refunded" // Payment was partially refunded
)

// PaymentRefund represents a refund transaction
type PaymentRefund struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	PaymentID       uint      `json:"payment_id" gorm:"not null;index"`
	StripeRefundID  string    `json:"-" gorm:"size:100;unique;index"` // Stripe Refund ID (hidden)
	Amount          int64     `json:"amount"`                          // Refund amount in cents
	Reason          string    `json:"reason" gorm:"size:500"`
	Status          string    `json:"status" gorm:"size:20"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relationships
	Payment Payment `json:"-" gorm:"foreignKey:PaymentID"`
}

// PaymentAuditLog tracks all payment-related activities for compliance
type PaymentAuditLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PaymentID uint      `json:"payment_id" gorm:"not null;index"`
	UserID    *uint     `json:"user_id,omitempty" gorm:"index"` // Nullable for system events
	Action    string    `json:"action" gorm:"size:50;not null"`
	OldValue  string    `json:"-" gorm:"type:text"` // Hidden from JSON
	NewValue  string    `json:"-" gorm:"type:text"` // Hidden from JSON
	Reason    string    `json:"reason" gorm:"size:255"`
	IPAddress string    `json:"ip_address" gorm:"size:45"`
	UserAgent string    `json:"user_agent" gorm:"size:500"`
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Payment Payment `json:"-" gorm:"foreignKey:PaymentID"`
	User    *User   `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Payment request/response models

// CreatePaymentRequest represents a request to create a payment
type CreatePaymentRequest struct {
	AppointmentID uint   `json:"appointment_id" binding:"required"`
	Amount        int64  `json:"amount" binding:"required,min=1"`         // Amount in cents
	Currency      string `json:"currency" binding:"required,len=3"`       // e.g., "USD"
	Description   string `json:"description" binding:"required,min=5,max=500"`
	PaymentMethod string `json:"payment_method,omitempty"` // Stripe Payment Method ID
}

// PaymentResponse represents the response when creating/getting a payment
type PaymentResponse struct {
	ID                uint              `json:"id"`
	AppointmentID     uint              `json:"appointment_id"`
	Amount            int64             `json:"amount"`
	Currency          string            `json:"currency"`
	Status            PaymentStatus     `json:"status"`
	Description       string            `json:"description"`
	RefundedAmount    int64             `json:"refunded_amount,omitempty"`
	ProcessedAt       *time.Time        `json:"processed_at,omitempty"`
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
	Appointment       AppointmentSummary `json:"appointment,omitempty"`
	Patient           UserSummary       `json:"patient,omitempty"`
	Refunds           []PaymentRefundResponse `json:"refunds,omitempty"`
}

// PaymentRefundResponse represents a refund in the API response
type PaymentRefundResponse struct {
	ID          uint       `json:"id"`
	Amount      int64      `json:"amount"`
	Reason      string     `json:"reason"`
	Status      string     `json:"status"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// CreateRefundRequest represents a request to create a refund
type CreateRefundRequest struct {
	Amount int64  `json:"amount,omitempty"` // If omitted, full refund
	Reason string `json:"reason" binding:"required,min=5,max=500"`
}

// PaymentIntentResponse represents the client secret for frontend
type PaymentIntentResponse struct {
	ClientSecret string `json:"client_secret"`
	PaymentID    uint   `json:"payment_id"`
	Amount       int64  `json:"amount"`
	Currency     string `json:"currency"`
}

// PaymentWebhookEvent represents a Stripe webhook event
type PaymentWebhookEvent struct {
	ID      string                 `json:"id"`
	Type    string                 `json:"type"`
	Data    map[string]interface{} `json:"data"`
	Created int64                  `json:"created"`
}

// Validation methods

// Validate validates the create payment request
func (r *CreatePaymentRequest) Validate() error {
	if r.AppointmentID == 0 {
		return fmt.Errorf("appointment_id is required")
	}
	if r.Amount < 50 { // Minimum $0.50
		return fmt.Errorf("amount must be at least 50 cents")
	}
	if r.Amount > 99999999 { // Maximum $999,999.99
		return fmt.Errorf("amount exceeds maximum allowed")
	}
	validCurrencies := map[string]bool{
		"USD": true,
		"EUR": true,
		"GBP": true,
		"CAD": true,
	}
	if !validCurrencies[r.Currency] {
		return fmt.Errorf("unsupported currency: %s", r.Currency)
	}
	return nil
}

// Validate validates the create refund request
func (r *CreateRefundRequest) Validate(maxAmount int64) error {
	if r.Amount > 0 && r.Amount > maxAmount {
		return fmt.Errorf("refund amount exceeds payment amount")
	}
	if r.Amount < 0 {
		return fmt.Errorf("refund amount cannot be negative")
	}
	return nil
}

// Helper methods

// ToResponse converts Payment to PaymentResponse
func (p *Payment) ToResponse() PaymentResponse {
	response := PaymentResponse{
		ID:             p.ID,
		AppointmentID:  p.AppointmentID,
		Amount:         p.Amount,
		Currency:       p.Currency,
		Status:         p.Status,
		Description:    p.Description,
		RefundedAmount: p.RefundedAmount,
		ProcessedAt:    p.ProcessedAt,
		CreatedAt:      p.CreatedAt,
		UpdatedAt:      p.UpdatedAt,
	}

	// Add appointment summary if loaded
	if p.Appointment.ID != 0 {
		response.Appointment = AppointmentSummary{
			ID:              p.Appointment.ID,
			ScheduledAt:     p.Appointment.ScheduledAt,
			AppointmentType: p.Appointment.AppointmentType,
			Status:          p.Appointment.Status,
		}
	}

	// Add patient summary if loaded
	if p.Patient.ID != 0 {
		response.Patient = NewUserSummary(p.Patient)
	}

	// Add refunds if loaded
	for _, refund := range p.Refunds {
		response.Refunds = append(response.Refunds, PaymentRefundResponse{
			ID:          refund.ID,
			Amount:      refund.Amount,
			Reason:      refund.Reason,
			Status:      refund.Status,
			ProcessedAt: refund.ProcessedAt,
			CreatedAt:   refund.CreatedAt,
		})
	}

	return response
}

// GetAmountInDollars returns the amount in dollars (for display)
func (p *Payment) GetAmountInDollars() float64 {
	return float64(p.Amount) / 100.0
}

// GetRefundedAmountInDollars returns the refunded amount in dollars
func (p *Payment) GetRefundedAmountInDollars() float64 {
	return float64(p.RefundedAmount) / 100.0
}

// IsRefundable checks if the payment can be refunded
func (p *Payment) IsRefundable() bool {
	return p.Status == PaymentStatusSucceeded && p.RefundedAmount < p.Amount
}

// GetRefundableAmount returns the amount that can still be refunded
func (p *Payment) GetRefundableAmount() int64 {
	if !p.IsRefundable() {
		return 0
	}
	return p.Amount - p.RefundedAmount
}

// CanBeProcessed checks if payment is in a state where it can be processed
func (p *Payment) CanBeProcessed() bool {
	return p.Status == PaymentStatusPending || p.Status == PaymentStatusProcessing
}

// Table names
func (Payment) TableName() string {
	return "payments"
}

func (PaymentRefund) TableName() string {
	return "payment_refunds"
}

func (PaymentAuditLog) TableName() string {
	return "payment_audit_logs"
}

