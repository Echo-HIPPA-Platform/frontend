package routes

import (
	"backend/internal/handlers"
	"backend/pkg/middleware"
	"github.com/gin-gonic/gin"
)

func SetupAppointmentRoutes(router *gin.Engine, appointmentHandler *handlers.AppointmentHandler, authMiddleware *middleware.AuthMiddleware) {
	// API group with authentication
	api := router.Group("/api")
	api.Use(authMiddleware.Authenticate())

	// Doctor availability endpoints
	doctors := api.Group("/doctors")
	{
		// Doctor sets their own availability
		doctors.POST("/availability", appointmentHandler.SetDoctorAvailability)
		doctors.GET("/availability", appointmentHandler.GetDoctorAvailability)
		
		// Patients can view available slots for any doctor
		doctors.GET("/:doctorId/slots", appointmentHandler.GetAvailableSlots)
	}

	// Appointment management endpoints
	appointments := api.Group("/appointments")
	{
		// Create new appointment (patients only)
		appointments.POST("", appointmentHandler.BookAppointment)
		
		// Get specific appointment (patients and doctors)
		appointments.GET("/:id", appointmentHandler.GetAppointment)
		
		// Reschedule appointment (patients and doctors)
		appointments.PUT("/:id/reschedule", appointmentHandler.RescheduleAppointment)
		
		// Cancel appointment (patients and doctors)
		appointments.PUT("/:id/cancel", appointmentHandler.CancelAppointment)
		
		// Get notification history for appointment
		appointments.GET("/:id/notifications", appointmentHandler.GetNotificationHistory)
	}
}

