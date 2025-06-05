package handlers

import (
	"net/http"
	"strconv"

	"backend/internal/models"
	"backend/internal/services"
	"backend/pkg/auth"
	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

type SecureNoteHandler struct {
	secureNoteService *services.SecureNoteService
	logger            *logger.Logger
}

func NewSecureNoteHandler(secureNoteService *services.SecureNoteService, logger *logger.Logger) *SecureNoteHandler {
	return &SecureNoteHandler{
		secureNoteService: secureNoteService,
		logger:            logger,
	}
}

// CreateSecureNote creates a new encrypted doctor's note
// POST /api/secure-notes
func (h *SecureNoteHandler) CreateSecureNote(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "doctor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can create secure notes"})
		return
	}

	var req models.SecureNoteRequest
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
	userAgent := c.GetHeader("User-Agent")

	note, err := h.secureNoteService.CreateSecureNote(userClaims.UserID, &req, ipAddress, userAgent)
	if err != nil {
		h.logger.Error("Failed to create secure note: " + err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"secure_note": note})
}

// GetSecureNote retrieves and decrypts a secure note
// POST /api/secure-notes/:id/access (POST because it requires access reason)
func (h *SecureNoteHandler) GetSecureNote(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	var req models.SecureNoteAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	note, err := h.secureNoteService.GetSecureNote(uint(noteID), userClaims.UserID, req.AccessReason, ipAddress, userAgent)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to get secure note: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve note"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"secure_note": note})
}

// UpdateSecureNote updates an existing secure note
// PUT /api/secure-notes/:id
func (h *SecureNoteHandler) UpdateSecureNote(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "doctor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can update secure notes"})
		return
	}

	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	var req models.SecureNoteRequest
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
	userAgent := c.GetHeader("User-Agent")

	note, err := h.secureNoteService.UpdateSecureNote(uint(noteID), userClaims.UserID, &req, ipAddress, userAgent)
	if err != nil {
		if err.Error() == "access denied: only the creating doctor can update this note" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to update secure note: " + err.Error())
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"secure_note": note})
}

// GetSecureNotesByAppointment gets all notes for an appointment
// POST /api/appointments/:appointmentId/secure-notes/access
func (h *SecureNoteHandler) GetSecureNotesByAppointment(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	appointmentIDStr := c.Param("appointmentId")
	appointmentID, err := strconv.ParseUint(appointmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var req models.SecureNoteAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	notes, err := h.secureNoteService.GetSecureNotesByAppointment(uint(appointmentID), userClaims.UserID, req.AccessReason, ipAddress, userAgent)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to get secure notes by appointment: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notes"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"secure_notes": notes})
}

// GetSecureNotesByPatient gets all notes for a patient
// POST /api/patients/:patientId/secure-notes/access
func (h *SecureNoteHandler) GetSecureNotesByPatient(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	patientIDStr := c.Param("patientId")
	patientID, err := strconv.ParseUint(patientIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var req models.SecureNoteAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	notes, err := h.secureNoteService.GetSecureNotesByPatient(uint(patientID), userClaims.UserID, req.AccessReason, limit, offset, ipAddress, userAgent)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to get secure notes by patient: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notes"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"secure_notes": notes,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(notes),
		},
	})
}

// ArchiveSecureNote archives a secure note
// PUT /api/secure-notes/:id/archive
func (h *SecureNoteHandler) ArchiveSecureNote(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "doctor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only doctors can archive secure notes"})
		return
	}

	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	var req models.SecureNoteAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	if err := h.secureNoteService.ArchiveSecureNote(uint(noteID), userClaims.UserID, req.AccessReason, ipAddress, userAgent); err != nil {
		if err.Error() == "access denied: only the creating doctor can archive this note" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to archive secure note: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to archive note"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Note archived successfully"})
}

// GetSecureNoteAuditLogs gets audit logs for a secure note
// GET /api/secure-notes/:id/audit-logs
func (h *SecureNoteHandler) GetSecureNoteAuditLogs(c *gin.Context) {
	claims, exists := c.Get("userClaims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userClaims := claims.(*auth.Claims)
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	ipAddress := c.ClientIP()
	auditLogs, err := h.secureNoteService.GetAuditLogs(uint(noteID), userClaims.UserID, ipAddress)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		} else {
			h.logger.Error("Failed to get audit logs: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve audit logs"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"audit_logs": auditLogs})
}

