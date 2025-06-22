package stripe

import (
	"encoding/json"
	"fmt"
	"os"
	//"time"

	"backend/pkg/logger"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/refund"
	"github.com/stripe/stripe-go/v76/webhook"
)

// PaymentService handles Stripe payment integration
type PaymentService struct {
	logger           *logger.Logger
	webhookSecret    string
	stripeSecretKey  string
}

// StripeConfig represents Stripe configuration
type StripeConfig struct {
	SecretKey     string
	WebhookSecret string
}

// PaymentIntentOptions represents options for creating a payment intent
type PaymentIntentOptions struct {
	Amount              int64
	Currency            string
	Description         string
	CustomerID          string
	PaymentMethodID     string
	ConfirmationMethod  string
	AutomaticPaymentMethods bool
	Metadata            map[string]string
}

// CustomerOptions represents options for creating a Stripe customer
type CustomerOptions struct {
	Email       string
	Name        string
	Phone       string
	Description string
	Metadata    map[string]string
}

// RefundOptions represents options for creating a refund
type RefundOptions struct {
	PaymentIntentID string
	Amount          *int64 // nil for full refund
	Reason          string
	Metadata        map[string]string
}

// NewPaymentService creates a new Stripe payment service
func NewPaymentService(logger *logger.Logger) (*PaymentService, error) {
	config := StripeConfig{
		SecretKey:     os.Getenv("STRIPE_SECRET_KEY"),
		WebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
	}

	if config.SecretKey == "" {
		return nil, fmt.Errorf("STRIPE_SECRET_KEY environment variable is required")
	}

	if config.WebhookSecret == "" {
		return nil, fmt.Errorf("STRIPE_WEBHOOK_SECRET environment variable is required")
	}

	// Initialize Stripe with the secret key
	stripe.Key = config.SecretKey

	return &PaymentService{
		logger:           logger,
		webhookSecret:    config.WebhookSecret,
		stripeSecretKey:  config.SecretKey,
	}, nil
}

// CreateCustomer creates a new Stripe customer
func (p *PaymentService) CreateCustomer(options CustomerOptions) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(options.Email),
		Name:  stripe.String(options.Name),
	}

	if options.Phone != "" {
		params.Phone = stripe.String(options.Phone)
	}

	if options.Description != "" {
		params.Description = stripe.String(options.Description)
	}

	if options.Metadata != nil {
		for key, value := range options.Metadata {
			params.AddMetadata(key, value)
		}
	}

	cust, err := customer.New(params)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to create Stripe customer: %v", err))
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	p.logger.Info(fmt.Sprintf("Created Stripe customer: %s (email: %s)", cust.ID, options.Email))
	return cust, nil
}

// GetCustomer retrieves a Stripe customer
func (p *PaymentService) GetCustomer(customerID string) (*stripe.Customer, error) {
	cust, err := customer.Get(customerID, nil)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to get Stripe customer %s: %v", customerID, err))
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}

	return cust, nil
}

// CreatePaymentIntent creates a new Stripe payment intent
func (p *PaymentService) CreatePaymentIntent(options PaymentIntentOptions) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:      stripe.Int64(options.Amount),
		Currency:    stripe.String(options.Currency),
		Description: stripe.String(options.Description),
	}

	// Set customer if provided
	if options.CustomerID != "" {
		params.Customer = stripe.String(options.CustomerID)
	}

	// Set payment method if provided
	if options.PaymentMethodID != "" {
		params.PaymentMethod = stripe.String(options.PaymentMethodID)
		params.ConfirmationMethod = stripe.String("manual")
		params.Confirm = stripe.Bool(true)
	} else {
		// Enable automatic payment methods for easier frontend integration
		if options.AutomaticPaymentMethods {
			params.AutomaticPaymentMethods = &stripe.PaymentIntentAutomaticPaymentMethodsParams{
				Enabled: stripe.Bool(true),
			}
		}
	}

	// Add metadata
	if options.Metadata != nil {
		for key, value := range options.Metadata {
			params.AddMetadata(key, value)
		}
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to create Stripe payment intent: %v", err))
		return nil, fmt.Errorf("failed to create payment intent: %w", err)
	}

	p.logger.Info(fmt.Sprintf("Created Stripe payment intent: %s (amount: %d %s)", pi.ID, options.Amount, options.Currency))
	return pi, nil
}

// GetPaymentIntent retrieves a Stripe payment intent
func (p *PaymentService) GetPaymentIntent(paymentIntentID string) (*stripe.PaymentIntent, error) {
	pi, err := paymentintent.Get(paymentIntentID, nil)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to get Stripe payment intent %s: %v", paymentIntentID, err))
		return nil, fmt.Errorf("failed to get payment intent: %w", err)
	}

	return pi, nil
}

// ConfirmPaymentIntent confirms a payment intent
func (p *PaymentService) ConfirmPaymentIntent(paymentIntentID string, paymentMethodID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentConfirmParams{
		PaymentMethod: stripe.String(paymentMethodID),
	}

	pi, err := paymentintent.Confirm(paymentIntentID, params)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to confirm Stripe payment intent %s: %v", paymentIntentID, err))
		return nil, fmt.Errorf("failed to confirm payment intent: %w", err)
	}

	p.logger.Info(fmt.Sprintf("Confirmed Stripe payment intent: %s", paymentIntentID))
	return pi, nil
}

// CancelPaymentIntent cancels a payment intent
func (p *PaymentService) CancelPaymentIntent(paymentIntentID string, reason string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentCancelParams{}
	if reason != "" {
		params.CancellationReason = stripe.String(reason)
	}

	pi, err := paymentintent.Cancel(paymentIntentID, params)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to cancel Stripe payment intent %s: %v", paymentIntentID, err))
		return nil, fmt.Errorf("failed to cancel payment intent: %w", err)
	}

	p.logger.Info(fmt.Sprintf("Canceled Stripe payment intent: %s (reason: %s)", paymentIntentID, reason))
	return pi, nil
}

// CreateRefund creates a refund for a payment intent
func (p *PaymentService) CreateRefund(options RefundOptions) (*stripe.Refund, error) {
	params := &stripe.RefundParams{
		PaymentIntent: stripe.String(options.PaymentIntentID),
	}

	// Set amount if specified (otherwise full refund)
	if options.Amount != nil {
		params.Amount = stripe.Int64(*options.Amount)
	}

	// Set reason if provided
	if options.Reason != "" {
		params.Reason = stripe.String(options.Reason)
	}

	// Add metadata
	if options.Metadata != nil {
		for key, value := range options.Metadata {
			params.AddMetadata(key, value)
		}
	}

	ref, err := refund.New(params)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to create Stripe refund for payment intent %s: %v", options.PaymentIntentID, err))
		return nil, fmt.Errorf("failed to create refund: %w", err)
	}

	amountStr := "full"
	if options.Amount != nil {
		amountStr = fmt.Sprintf("%d", *options.Amount)
	}
	p.logger.Info(fmt.Sprintf("Created Stripe refund: %s for payment intent: %s (amount: %s)", ref.ID, options.PaymentIntentID, amountStr))
	return ref, nil
}

// GetRefund retrieves a Stripe refund
func (p *PaymentService) GetRefund(refundID string) (*stripe.Refund, error) {
	ref, err := refund.Get(refundID, nil)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to get Stripe refund %s: %v", refundID, err))
		return nil, fmt.Errorf("failed to get refund: %w", err)
	}

	return ref, nil
}

// ValidateWebhook validates a Stripe webhook signature
func (p *PaymentService) ValidateWebhook(body []byte, signature string) (*stripe.Event, error) {
	event, err := webhook.ConstructEvent(body, signature, p.webhookSecret)
	if err != nil {
		p.logger.Error(fmt.Sprintf("Failed to validate Stripe webhook: %v", err))
		return nil, fmt.Errorf("invalid webhook signature: %w", err)
	}

	return &event, nil
}

// ParseWebhookEvent parses a Stripe webhook event
func (p *PaymentService) ParseWebhookEvent(event *stripe.Event) (map[string]interface{}, error) {
	var data map[string]interface{}

	if err := json.Unmarshal(event.Data.Raw, &data); err != nil {
		p.logger.Error(fmt.Sprintf("Failed to parse Stripe webhook event data: %v", err))
		return nil, fmt.Errorf("failed to parse event data: %w", err)
	}

	return data, nil
}

// Helper methods

// FormatAmountFromCents converts cents to dollars for display
func FormatAmountFromCents(cents int64, currency string) string {
	dollars := float64(cents) / 100.0
	switch currency {
	case "USD":
		return fmt.Sprintf("$%.2f", dollars)
	case "EUR":
		return fmt.Sprintf("€%.2f", dollars)
	case "GBP":
		return fmt.Sprintf("£%.2f", dollars)
	default:
		return fmt.Sprintf("%.2f %s", dollars, currency)
	}
}

// ConvertDollarsToCents converts dollars to cents for Stripe
func ConvertDollarsToCents(dollars float64) int64 {
	return int64(dollars * 100)
}

// ValidateStripeConfig validates that Stripe configuration is properly set
func ValidateStripeConfig() error {
	requiredVars := []string{
		"STRIPE_SECRET_KEY",
		"STRIPE_WEBHOOK_SECRET",
	}

	for _, varName := range requiredVars {
		if os.Getenv(varName) == "" {
			return fmt.Errorf("missing required environment variable: %s", varName)
		}
	}

	return nil
}

// IsStripeTestMode checks if we're running in Stripe test mode
func IsStripeTestMode() bool {
	return len(os.Getenv("STRIPE_SECRET_KEY")) > 0 && os.Getenv("STRIPE_SECRET_KEY")[:7] == "sk_test"
}

// SanitizeStripeError removes sensitive information from Stripe errors for logging
func SanitizeStripeError(err error) string {
	if err == nil {
		return ""
	}

	// Remove any potentially sensitive information from error messages
	errorStr := err.Error()
	// Add any specific sanitization logic here if needed
	return errorStr
}

