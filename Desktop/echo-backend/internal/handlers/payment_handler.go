package handlers

import (
	"backend/internal/services"
	"net/http"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	service services.PaymentService
}

func NewPaymentHandler(service services.PaymentService) *PaymentHandler {
	return &PaymentHandler{service: service}
}

type VerifyPaymentRequest struct {
	Reference string `json:"reference" binding:"required"`
}

func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	var req VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request, reference is required"})
		return
	}

	success, err := h.service.VerifyTransaction(req.Reference)
	if err != nil || !success {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "Payment verification failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment verified successfully"})
}