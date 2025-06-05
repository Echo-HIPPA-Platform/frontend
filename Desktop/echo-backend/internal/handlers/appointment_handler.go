package handlers

import (
	"net/http"
	"strconv"
	"time"

	"backend/internal/models"
	"backend/internal/services"
	"backend/pkg/auth"
	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AppointmentHandler struct {
	appointmentService *services.AppointmentService
	logger             *logger.Logger
}

func NewAppointmentHandler(appointmentService *services.AppointmentService, logger *logger.Logger) *AppointmentHandler {
	return &AppointmentHandler{
		appointmentService: appointmentService,
		logger:             logger,
	}
}

// Doctor Availability Endpoints

// SetDoctorAvailability sets weekly availability for a doctor
// POST /api/doctors/availability
func (h *AppointmentHandler) SetDoctorAvailability(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "doctor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can set availability"})
		return
	}

	var req models.DoctorAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	if err := h.appointmentService.SetDoctorAvailability(userClaims.UserID, &req, ipAddress); err != nil {
		h.logger.Error("Failed to set doctor availability: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set availability"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Availability set successfully"})
}

// GetDoctorAvailability gets weekly availability for a doctor
// GET /api/doctors/availability
func (h *AppointmentHandler) GetDoctorAvailability(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "doctor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can view their availability"})
		return
	}

	availabilities, err := h.appointmentService.GetDoctorAvailability(userClaims.UserID)
	if err != nil {
		h.logger.Error("Failed to get doctor availability: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"availabilities": availabilities})
}

// GetAvailableSlots gets available appointment slots for a doctor on a specific date
// GET /api/doctors/:doctorId/slots?date=2024-01-15
func (h *AppointmentHandler) GetAvailableSlots(c *gin.Context) {
	doctorIDStr := c.Param("doctorId")
	doctorID, err := strconv.ParseUint(doctorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	dateStr := c.Query("date")
	if dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required (format: YYYY-MM-DD)"})
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format (use YYYY-MM-DD)"})
		return
	}

	slots, err := h.appointmentService.GetAvailableSlots(uint(doctorID), date)
	if err != nil {
		h.logger.Error("Failed to get available slots: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get available slots"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"slots": slots})
}

// Appointment Booking Endpoints

// BookAppointment books a new appointment
// POST /api/appointments
func (h *AppointmentHandler) BookAppointment(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "patient" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only patients can book appointments"})
		return
	}

	var req models.BookAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	appointment, err := h.appointmentService.BookAppointment(userClaims.UserID, &req, ipAddress)
	if err != nil {
		h.logger.Error("Failed to book appointment: " + err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Send confirmation notification asynchronously when notification service is ready
	// go func() {
	// 	if err := h.notificationService.SendAppointmentConfirmation(appointment.ID); err != nil {
	// 		h.logger.Error("Failed to send confirmation notification: " + err.Error())
	// 	}
	// }()

	c.JSON(http.StatusCreated, gin.H{"appointment": appointment})
}

// GetAppointment gets a specific appointment
// GET /api/appointments/:id
func (h *AppointmentHandler) GetAppointment(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	appointmentIDStr := c.Param("id")
	appointmentID, err := strconv.ParseUint(appointmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	appointment, err := h.appointmentService.GetAppointment(uint(appointmentID), userClaims.UserID)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to get appointment: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get appointment"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"appointment": appointment})
}

// RescheduleAppointment reschedules an existing appointment
// PUT /api/appointments/:id/reschedule
func (h *AppointmentHandler) RescheduleAppointment(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	appointmentIDStr := c.Param("id")
	appointmentID, err := strconv.ParseUint(appointmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var req models.RescheduleAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	appointment, err := h.appointmentService.RescheduleAppointment(uint(appointmentID), userClaims.UserID, &req, ipAddress)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to reschedule appointment: " + err.Error())
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	// TODO: Send reschedule notification asynchronously when notification service is ready
	// go func() {
	// 	if err := h.notificationService.SendRescheduleNotification(appointment.ID, req.Reason); err != nil {
	// 		h.logger.Error("Failed to send reschedule notification: " + err.Error())
	// 	}
	// }()

	c.JSON(http.StatusOK, gin.H{"appointment": appointment})
}

// CancelAppointment cancels an existing appointment
// PUT /api/appointments/:id/cancel
func (h *AppointmentHandler) CancelAppointment(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	appointmentIDStr := c.Param("id")
	appointmentID, err := strconv.ParseUint(appointmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var req models.CancelAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	if err := h.appointmentService.CancelAppointment(uint(appointmentID), userClaims.UserID, &req, ipAddress); err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to cancel appointment: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel appointment"})
		}
		return
	}

	// TODO: Send cancellation notification asynchronously when notification service is ready
	// go func() {
	// 	if err := h.notificationService.SendCancellationNotification(uint(appointmentID), req.Reason); err != nil {
	// 		h.logger.Error("Failed to send cancellation notification: " + err.Error())
	// 	}
	// }()

	c.JSON(http.StatusOK, gin.H{"message": "Appointment canceled successfully"})
}

// GetNotificationHistory gets notification history for an appointment
// GET /api/appointments/:id/notifications
func (h *AppointmentHandler) GetNotificationHistory(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	appointmentIDStr := c.Param("id")
	appointmentID, err := strconv.ParseUint(appointmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Verify access to appointment first
	_, err = h.appointmentService.GetAppointment(uint(appointmentID), userClaims.UserID)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to verify appointment access: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify access"})
		}
		return
	}

	// TODO: Implement notification history when notification service is ready
	c.JSON(http.StatusOK, gin.H{"notifications": []interface{}{}})
}

