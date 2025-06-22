package main

import (
	// Your existing imports
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/routes"
	"backend/internal/services"
	"backend/pkg/logger"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// IntegrateAppointmentSystem integrates the complete appointment scheduling system
func IntegrateAppointmentSystem(router *gin.Engine, db *gorm.DB, logger *logger.Logger, authMiddleware *middleware.AuthMiddleware) {
	// --- FIX: Correct Initialization Order ---

	// 1. Initialize all repositories first
	userRepo := repository.NewUserRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)

	// 2. Initialize the notification service, as the appointment service depends on it
	fromEmail := "noreply@yourhealthcareapp.com" // Replace with your verified SES email
	notificationService, err := services.NewNotificationService(
		appointmentRepo,
		userRepo,
		logger,
		fromEmail,
	)
	if err != nil {
		logger.Error("Failed to initialize notification service: " + err.Error())
		return
	}

	// 3. Initialize the appointment service
	appointmentService := services.NewAppointmentService(appointmentRepo, userRepo, logger)

	// 4. Initialize the handler with the correctly created services
	appointmentHandler := handlers.NewAppointmentHandler(appointmentService, logger) // The handler only needs the appointment service

	// 5. Setup the routes
	routes.SetupAppointmentRoutes(router, appointmentHandler, authMiddleware)

	// Optional: Setup scheduled reminder job
	setupReminderScheduler(notificationService, logger)
}

// setupReminderScheduler sets up automated appointment reminders
func setupReminderScheduler(notificationService *services.NotificationService, logger *logger.Logger) {
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	go func() {
		for {
			<-ticker.C
			if err := notificationService.SendAppointmentReminders(); err != nil {
				logger.Error("Failed to send appointment reminders: " + err.Error())
			}
		}
	}()
}
