package handlers

import (
	"net/http"
	"strconv"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AdminHandler struct {
	adminService *services.AdminService
	logger       *logger.Logger
	validator    *validator.Validate
}

func NewAdminHandler(adminService *services.AdminService, logger *logger.Logger) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
		logger:       logger,
		validator:    validator.New(),
	}
}

// Doctor Management Endpoints

// GetDoctors handles listing doctors with filtering
// @Summary List doctors
// @Description Get paginated list of doctors with optional status filtering (Admin only)
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by verification status" Enums(pending,approved,rejected,suspended)
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Items per page (default: 20, max: 100)"
// @Success 200 {object} models.DoctorListResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/doctors [get]
func (h *AdminHandler) GetDoctors(c *gin.Context) {
	adminUserID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Parse query parameters
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// Call service
	response, err := h.adminService.GetDoctors(status, page, pageSize, adminUserID, c.ClientIP())
	if err != nil {
		h.logger.Error("Failed to get doctors: " + err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetDoctorByID handles getting a specific doctor
// @Summary Get doctor by ID
// @Description Get detailed information about a specific doctor (Admin only)
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param id path int true "Doctor ID"
// @Success 200 {object} models.DoctorResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/doctors/{id} [get]
func (h *AdminHandler) GetDoctorByID(c *gin.Context) {
	adminUserID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Parse doctor ID
	doctorIDStr := c.Param("id")
	doctorID, err := strconv.ParseUint(doctorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	// Call service
	response, err := h.adminService.GetDoctorByID(uint(doctorID), adminUserID, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		h.logger.Error("Failed to get doctor: " + err.Error())
		
		if err.Error() == "doctor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get doctor"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// VerifyDoctor handles doctor verification actions
// @Summary Verify doctor
// @Description Approve, reject, or suspend a doctor's account (Admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Doctor ID"
// @Param verification body models.DoctorVerificationRequest true "Verification action and reason"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/doctors/{id}/verify [put]
func (h *AdminHandler) VerifyDoctor(c *gin.Context) {
	adminUserID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Parse doctor ID
	doctorIDStr := c.Param("id")
	doctorID, err := strconv.ParseUint(doctorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid doctor ID"})
		return
	}

	// Parse request body
	var req models.DoctorVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Call service
	if err := h.adminService.VerifyDoctor(uint(doctorID), &req, adminUserID, c.ClientIP(), c.GetHeader("User-Agent")); err != nil {
		h.logger.Error("Failed to verify doctor: " + err.Error())
		
		if err.Error() == "doctor not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Doctor verification updated successfully"})
}

// User Management Endpoints

// GetUsers handles listing users with filtering
// @Summary List users
// @Description Get paginated list of users with optional filtering (Admin only)
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param role query string false "Filter by user role" Enums(patient,doctor,admin)
// @Param active query bool false "Filter by active status"
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Items per page (default: 20, max: 100)"
// @Success 200 {object} models.UserListResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/users [get]
func (h *AdminHandler) GetUsers(c *gin.Context) {
	adminUserID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Parse query parameters
	role := c.Query("role")
	active := c.Query("active")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// Call service
	response, err := h.adminService.GetUsers(role, active, page, pageSize, adminUserID, c.ClientIP())
	if err != nil {
		h.logger.Error("Failed to get users: " + err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ToggleUserStatus handles user account activation/deactivation
// @Summary Toggle user status
// @Description Activate or deactivate a user account (Admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Param status body gin.H true "User status change"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/users/{id}/status [put]
func (h *AdminHandler) ToggleUserStatus(c *gin.Context) {
	adminUserID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Parse user ID
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request body
	var req struct {
		Active bool   `json:"active" validate:"required"`
		Reason string `json:"reason,omitempty" validate:"max=500"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Call service
	if err := h.adminService.ToggleUserStatus(uint(userID), req.Active, req.Reason, adminUserID, c.ClientIP(), c.GetHeader("User-Agent")); err != nil {
		h.logger.Error("Failed to toggle user status: " + err.Error())
		
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	action := "deactivated"
	if req.Active {
		action = "activated"
	}

	c.JSON(http.StatusOK, gin.H{"message": "User " + action + " successfully"})
}

// Dashboard and Analytics Endpoints

// GetDashboard handles admin dashboard statistics
// @Summary Get dashboard statistics
// @Description Get admin dashboard with system statistics (Admin only)
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.AdminDashboardStats
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/dashboard [get]
func (h *AdminHandler) GetDashboard(c *gin.Context) {
	adminUserID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Call service
	stats, err := h.adminService.GetDashboardStats(adminUserID, c.ClientIP())
	if err != nil {
		h.logger.Error("Failed to get dashboard stats: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// HIPAA Audit Trail Endpoints

// GetAuditLogs handles retrieving admin audit logs
// @Summary Get audit logs
// @Description Get paginated admin audit logs with filtering (Admin only)
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param admin_user_id query int false "Filter by admin user ID"
// @Param target_user_id query int false "Filter by target user ID"
// @Param action query string false "Filter by action type"
// @Param start_date query string false "Start date (RFC3339 format)"
// @Param end_date query string false "End date (RFC3339 format)"
// @Param page query int false "Page number (default: 1)"
// @Param page_size query int false "Items per page (default: 50, max: 100)"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /admin/audit-logs [get]
func (h *AdminHandler) GetAuditLogs(c *gin.Context) {
	requestingAdminID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin user not found in context"})
		return
	}

	// Parse query parameters
	var adminUserID, targetUserID *uint
	if adminUserIDStr := c.Query("admin_user_id"); adminUserIDStr != "" {
		id, err := strconv.ParseUint(adminUserIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin_user_id"})
			return
		}
		uintID := uint(id)
		adminUserID = &uintID
	}

	if targetUserIDStr := c.Query("target_user_id"); targetUserIDStr != "" {
		id, err := strconv.ParseUint(targetUserIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target_user_id"})
			return
		}
		uintID := uint(id)
		targetUserID = &uintID
	}

	action := c.Query("action")

	var startDate, endDate *time.Time
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		parsedTime, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format (use RFC3339)"})
			return
		}
		startDate = &parsedTime
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		parsedTime, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format (use RFC3339)"})
			return
		}
		endDate = &parsedTime
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	// Call service
	logs, total, totalPages, err := h.adminService.GetAuditLogs(adminUserID, targetUserID, action, startDate, endDate, page, pageSize, requestingAdminID, c.ClientIP())
	if err != nil {
		h.logger.Error("Failed to get audit logs: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get audit logs"})
		return
	}

	response := gin.H{
		"audit_logs":  logs,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	}

	c.JSON(http.StatusOK, response)
}

