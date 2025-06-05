package services

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"time"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/logger"
	"gorm.io/gorm"
)

type AdminService struct {
	adminRepo *repository.AdminRepository
	userRepo  *repository.UserRepository
	logger    *logger.Logger
}

func NewAdminService(adminRepo *repository.AdminRepository, userRepo *repository.UserRepository, logger *logger.Logger) *AdminService {
	return &AdminService{
		adminRepo: adminRepo,
		userRepo:  userRepo,
		logger:    logger,
	}
}

// Doctor Management Methods

// GetDoctors retrieves doctors with filtering and pagination
func (s *AdminService) GetDoctors(status string, page, pageSize int, adminUserID uint, ipAddress string) (*models.DoctorListResponse, error) {
	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Parse status filter
	var statusFilter *models.DoctorVerificationStatus
	if status != "" {
		statusValue := models.DoctorVerificationStatus(status)
		if statusValue.IsValid() {
			statusFilter = &statusValue
		} else {
			return nil, fmt.Errorf("invalid status filter: %s", status)
		}
	}

	// Get doctors from repository
	doctors, total, err := s.adminRepo.GetDoctors(statusFilter, page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("failed to get doctors: %w", err)
	}

	// Convert to response format
	doctorResponses := make([]models.DoctorResponse, len(doctors))
	for i, doctor := range doctors {
		doctorResponses[i] = doctor.ToResponse()
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	// Create HIPAA-compliant audit log
	auditDetails := fmt.Sprintf("Admin viewed doctors list (page %d, pageSize %d", page, pageSize)
	if statusFilter != nil {
		auditDetails += fmt.Sprintf(", status filter: %s", *statusFilter)
	}
	auditDetails += ")"

	auditLog := s.adminRepo.BuildAdminAuditLog(
		adminUserID,
		nil, // No specific target user
		"view_doctors_list",
		"doctor_profiles",
		nil,
		auditDetails,
		"", // No old value for view operations
		"", // No new value for view operations
		"", // No reason required for view operations
		ipAddress,
		"", // User agent would be passed from handler
		"", // Session ID would be extracted from JWT
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	// Log PHI access for HIPAA compliance
	s.logger.LogPHIAccess(adminUserID, "", "admin", "doctor_profiles_list", "view", ipAddress)

	return &models.DoctorListResponse{
		Doctors:    doctorResponses,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetDoctorByID retrieves a specific doctor by ID
func (s *AdminService) GetDoctorByID(doctorID uint, adminUserID uint, ipAddress, userAgent string) (*models.DoctorResponse, error) {
	doctor, err := s.adminRepo.GetDoctorByID(doctorID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("doctor not found")
		}
		return nil, fmt.Errorf("failed to get doctor: %w", err)
	}

	// Create HIPAA-compliant audit log
	auditLog := s.adminRepo.BuildAdminAuditLog(
		adminUserID,
		&doctor.UserID,
		"view_doctor_details",
		"doctor_profile",
		&doctorID,
		fmt.Sprintf("Admin viewed doctor details (ID: %d, License: %s)", doctorID, doctor.LicenseNumber),
		"",
		"",
		"",
		ipAddress,
		userAgent,
		"",
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	// Log PHI access
	s.logger.LogPHIAccess(adminUserID, "", "admin", "doctor_profile", "view_details", ipAddress)

	response := doctor.ToResponse()
	return &response, nil
}

// VerifyDoctor approves, rejects, or suspends a doctor
func (s *AdminService) VerifyDoctor(doctorID uint, request *models.DoctorVerificationRequest, adminUserID uint, ipAddress, userAgent string) error {
	// Validate the action
	if !request.Action.IsValid() {
		return fmt.Errorf("invalid verification action: %s", request.Action)
	}

	// Get current doctor state for audit trail
	currentDoctor, err := s.adminRepo.GetDoctorByID(doctorID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("doctor not found")
		}
		return fmt.Errorf("failed to get doctor: %w", err)
	}

	oldStatus := currentDoctor.VerificationStatus
	newStatus := request.Action

	// Validate state transitions
	if err := s.validateStatusTransition(oldStatus, newStatus); err != nil {
		return err
	}

	// Require reason for rejection and suspension
	if (newStatus == models.VerificationRejected || newStatus == models.VerificationSuspended) && request.Reason == "" {
		return fmt.Errorf("reason is required for %s action", newStatus)
	}

	// Update doctor verification status
	if err := s.adminRepo.UpdateDoctorVerificationStatus(doctorID, newStatus, adminUserID, request.Reason); err != nil {
		return fmt.Errorf("failed to update doctor verification status: %w", err)
	}

	// Create comprehensive HIPAA-compliant audit log
	oldValue, _ := json.Marshal(map[string]interface{}{
		"verification_status": oldStatus,
		"verified_by":         currentDoctor.VerifiedBy,
		"verified_at":         currentDoctor.VerifiedAt,
	})

	newValue, _ := json.Marshal(map[string]interface{}{
		"verification_status": newStatus,
		"verified_by":         adminUserID,
		"verified_at":         time.Now(),
		"reason":              request.Reason,
	})

	auditLog := s.adminRepo.BuildAdminAuditLog(
		adminUserID,
		&currentDoctor.UserID,
		fmt.Sprintf("doctor_verification_%s", newStatus),
		"doctor_profile",
		&doctorID,
		fmt.Sprintf("Doctor verification status changed from %s to %s (License: %s)", oldStatus, newStatus, currentDoctor.LicenseNumber),
		string(oldValue),
		string(newValue),
		request.Reason,
		ipAddress,
		userAgent,
		"",
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	// Log security event for HIPAA compliance
	actionDescription := fmt.Sprintf("Doctor %s: %s (License: %s)", newStatus, currentDoctor.User.Email, currentDoctor.LicenseNumber)
	if request.Reason != "" {
		actionDescription += fmt.Sprintf(" - Reason: %s", request.Reason)
	}

	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "doctor_verification_change",
		UserID:    adminUserID,
		UserRole:  "admin",
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Message:   actionDescription,
	})

	return nil
}

// User Management Methods

// GetUsers retrieves users with filtering and pagination
func (s *AdminService) GetUsers(role, active string, page, pageSize int, adminUserID uint, ipAddress string) (*models.UserListResponse, error) {
	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Parse filters
	var roleFilter *models.UserRole
	if role != "" {
		roleValue := models.UserRole(role)
		if roleValue.IsValid() {
			roleFilter = &roleValue
		} else {
			return nil, fmt.Errorf("invalid role filter: %s", role)
		}
	}

	var activeFilter *bool
	if active != "" {
		activeValue, err := strconv.ParseBool(active)
		if err != nil {
			return nil, fmt.Errorf("invalid active filter: %s", active)
		}
		activeFilter = &activeValue
	}

	// Get users from repository
	users, total, err := s.adminRepo.GetUsers(roleFilter, activeFilter, page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	// Convert to response format
	userResponses := make([]models.UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = user.ToResponse()
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	// Create audit log
	auditDetails := fmt.Sprintf("Admin viewed users list (page %d, pageSize %d", page, pageSize)
	if roleFilter != nil {
		auditDetails += fmt.Sprintf(", role filter: %s", *roleFilter)
	}
	if activeFilter != nil {
		auditDetails += fmt.Sprintf(", active filter: %v", *activeFilter)
	}
	auditDetails += ")"

	auditLog := s.adminRepo.BuildAdminAuditLog(
		adminUserID,
		nil,
		"view_users_list",
		"users",
		nil,
		auditDetails,
		"",
		"",
		"",
		ipAddress,
		"",
		"",
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	// Log PHI access
	s.logger.LogPHIAccess(adminUserID, "", "admin", "users_list", "view", ipAddress)

	return &models.UserListResponse{
		Users:      userResponses,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// ToggleUserStatus activates or deactivates a user account
func (s *AdminService) ToggleUserStatus(userID uint, activate bool, reason string, adminUserID uint, ipAddress, userAgent string) error {
	// Get current user state
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Check if status is already set
	if user.IsActive == activate {
		status := "active"
		if !activate {
			status = "inactive"
		}
		return fmt.Errorf("user is already %s", status)
	}

	// Update user status
	if err := s.adminRepo.UpdateUserStatus(userID, activate); err != nil {
		return fmt.Errorf("failed to update user status: %w", err)
	}

	// Create audit log
	action := "user_deactivation"
	if activate {
		action = "user_activation"
	}

	oldValue, _ := json.Marshal(map[string]interface{}{"is_active": user.IsActive})
	newValue, _ := json.Marshal(map[string]interface{}{"is_active": activate})

	auditLog := s.adminRepo.BuildAdminAuditLog(
		adminUserID,
		&userID,
		action,
		"user",
		&userID,
		fmt.Sprintf("User account %s changed (Email: %s)", action, user.Email),
		string(oldValue),
		string(newValue),
		reason,
		ipAddress,
		userAgent,
		"",
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	// Log security event
	actionDescription := fmt.Sprintf("User %s: %s", action, user.Email)
	if reason != "" {
		actionDescription += fmt.Sprintf(" - Reason: %s", reason)
	}

	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     action,
		UserID:    adminUserID,
		UserRole:  "admin",
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Message:   actionDescription,
	})

	return nil
}

// Dashboard and Analytics Methods

// GetDashboardStats retrieves admin dashboard statistics
func (s *AdminService) GetDashboardStats(adminUserID uint, ipAddress string) (*models.AdminDashboardStats, error) {
	stats, err := s.adminRepo.GetDashboardStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard stats: %w", err)
	}

	// Create audit log for dashboard access
	auditLog := s.adminRepo.BuildAdminAuditLog(
		adminUserID,
		nil,
		"view_dashboard",
		"admin_dashboard",
		nil,
		"Admin accessed dashboard statistics",
		"",
		"",
		"",
		ipAddress,
		"",
		"",
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	return stats, nil
}

// Audit Trail Methods

// GetAuditLogs retrieves admin audit logs with filtering
func (s *AdminService) GetAuditLogs(adminUserID, targetUserID *uint, action string, startDate, endDate *time.Time, page, pageSize int, requestingAdminID uint, ipAddress string) ([]models.AdminAuditLogResponse, int64, int, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	// Get audit logs
	logs, total, err := s.adminRepo.GetAdminAuditLogs(adminUserID, targetUserID, action, startDate, endDate, page, pageSize)
	if err != nil {
		return nil, 0, 0, fmt.Errorf("failed to get audit logs: %w", err)
	}

	// Convert to response format
	responses := make([]models.AdminAuditLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = models.AdminAuditLogResponse{
			ID:         log.ID,
			AdminUser:  log.AdminUser.ToResponse(),
			Action:     log.Action,
			Resource:   log.Resource,
			ResourceID: log.ResourceID,
			Details:    log.Details,
			OldValue:   log.OldValue,
			NewValue:   log.NewValue,
			IPAddress:  log.IPAddress,
			Reason:     log.Reason,
			CreatedAt:  log.CreatedAt,
		}
		if log.TargetUser != nil {
			targetResponse := log.TargetUser.ToResponse()
			responses[i].TargetUser = &targetResponse
		}
	}

	// Log audit trail access
	auditLog := s.adminRepo.BuildAdminAuditLog(
		requestingAdminID,
		nil,
		"view_audit_logs",
		"admin_audit_logs",
		nil,
		fmt.Sprintf("Admin accessed audit logs (page %d, pageSize %d)", page, pageSize),
		"",
		"",
		"",
		ipAddress,
		"",
		"",
	)
	s.adminRepo.CreateAdminAuditLog(auditLog)

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return responses, total, totalPages, nil
}

// Helper Methods

// validateStatusTransition validates if a status transition is allowed
func (s *AdminService) validateStatusTransition(from, to models.DoctorVerificationStatus) error {
	// Define allowed transitions
	allowedTransitions := map[models.DoctorVerificationStatus][]models.DoctorVerificationStatus{
		models.VerificationPending: {
			models.VerificationApproved,
			models.VerificationRejected,
		},
		models.VerificationApproved: {
			models.VerificationSuspended,
		},
		models.VerificationRejected: {
			models.VerificationPending, // Allow re-review
		},
		models.VerificationSuspended: {
			models.VerificationApproved, // Allow reinstatement
		},
	}

	allowed, exists := allowedTransitions[from]
	if !exists {
		return fmt.Errorf("invalid current status: %s", from)
	}

	for _, allowedStatus := range allowed {
		if allowedStatus == to {
			return nil
		}
	}

	return fmt.Errorf("transition from %s to %s is not allowed", from, to)
}

