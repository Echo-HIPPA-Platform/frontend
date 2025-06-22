package services

import (
	"backend/internal/config"
	"backend/pkg/logger"
	"encoding/json"
	"fmt"
	"net/http"
)

type PaymentService interface {
	VerifyTransaction(reference string) (bool, error)
}

type paystackService struct {
	cfg    *config.Config
	logger *logger.Logger
}

func NewPaymentService(cfg *config.Config, logger *logger.Logger) PaymentService {
	return &paystackService{cfg: cfg, logger: logger}
}

func (s *paystackService) VerifyTransaction(reference string) (bool, error) {
	s.logger.Info("Verifying Paystack transaction: " + reference)
	url := fmt.Sprintf("https://api.paystack.co/transaction/verify/%s", reference)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, fmt.Errorf("failed to create verification request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.cfg.Paystack.SecretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("failed to execute verification request: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("failed to decode paystack response: %w", err)
	}

	if status, ok := result["status"].(bool); ok && status {
		if data, ok := result["data"].(map[string]interface{}); ok {
			if paymentStatus, ok := data["status"].(string); ok && paymentStatus == "success" {
				s.logger.Info("Paystack transaction verified successfully: " + reference)
				return true, nil
			}
		}
	}

	s.logger.Warn("Paystack transaction verification failed for reference: " + reference)
	return false, fmt.Errorf("payment verification failed")
}