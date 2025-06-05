package main

import (
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/internal/routes"
	"backend/internal/services"
	"backend/pkg/logger"
	"backend/pkg/middleware"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// IntegrateAppointmentSystem integrates the complete appointment scheduling system
// This function should be called from your main server setup
func IntegrateAppointmentSystem(router *gin.Engine, db *gorm.DB, logger *logger.Logger, authMiddleware *middleware.AuthMiddleware) {
	// Initialize repositories
	appointmentRepo := repository.NewAppointmentRepository(db)
	userRepo := repository.NewUserRepository(db) // Assuming you have this from existing user system

	// Initialize services
	appointmentService := services.NewAppointmentService(appointmentRepo, userRepo, logger)
	
	// Initialize notification service with AWS SES
	// Initialize notification repository
	notificationRepo := repository.NewNotificationRepository(db)

	// Note: Set your verified SES email address here
	fromEmail := "noreply@yourhealthcareapp.com" // Replace with your verified SES email
	notificationService := services.NewNotificationService(notificationRepo, appointmentRepo, userRepo, logger, fromEmail)

	// Initialize handlers
	appointmentHandler := handlers.NewAppointmentHandler(appointmentService, notificationService, logger)

	// Setup routes
	routes.SetupAppointmentRoutes(router, appointmentHandler, authMiddleware)

	// Optional: Setup scheduled reminder job
	// This would typically be done in a separate service or cron job
	// setupReminderScheduler(notificationService, logger)
}

// setupReminderScheduler sets up automated appointment reminders
// This is an example of how you might implement scheduled reminders
func setupReminderScheduler(notificationService *services.NotificationService, logger *logger.Logger) {
	// Example using a simple go routine with time.Ticker
	// In production, you'd want to use a proper job scheduler like cron
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	go func() {
		for {
			select {
			case <-ticker.C:
				if err := notificationService.SendAppointmentReminders(); err != nil {
					logger.Error("Failed to send appointment reminders: " + err.Error())
				}
			}
		}
	}()
}
