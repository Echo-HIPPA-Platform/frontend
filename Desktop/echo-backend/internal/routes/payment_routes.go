package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupPaymentRoutes(router *gin.RouterGroup, handler *handlers.PaymentHandler, authMiddleware *middleware.AuthMiddleware) {
	payments := router.Group("/payments")
	payments.Use(authMiddleware.AuthRequired())
	{
		payments.POST("/verify", handler.VerifyPayment)
	}
}