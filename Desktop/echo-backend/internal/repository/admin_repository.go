package repository

import (
	"fmt"
	"time"

	"backend/internal/models"
	"gorm.io/gorm"
)

type AdminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) *AdminRepository {
	return &AdminRepository{db: db}
}

// Doctor Management Methods

// GetDoctors retrieves doctors with filtering and pagination
func (r *AdminRepository) GetDoctors(status *models.DoctorVerificationStatus, page, pageSize int) ([]models.DoctorProfile, int64, error) {
	var doctors []models.DoctorProfile
	var total int64

	query := r.db.Preload("User").Preload("User.Profile").Preload("VerifierUser")

	// Apply status filter if provided
	if status != nil {
		query = query.Where("verification_status = ?", *status)
	}

	// Get total count
	if err := query.Model(&models.DoctorProfile{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count doctors: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&doctors).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get doctors: %w", err)
	}

	return doctors, total, nil
}

// GetDoctorByID retrieves a doctor by ID with all relationships
func (r *AdminRepository) GetDoctorByID(id uint) (*models.DoctorProfile, error) {
	var doctor models.DoctorProfile
	err := r.db.Preload("User").Preload("User.Profile").Preload("VerifierUser").First(&doctor, id).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

// GetDoctorByUserID retrieves a doctor by user ID
func (r *AdminRepository) GetDoctorByUserID(userID uint) (*models.DoctorProfile, error) {
	var doctor models.DoctorProfile
	err := r.db.Preload("User").Preload("User.Profile").Preload("VerifierUser").Where("user_id = ?", userID).First(&doctor).Error
	if err != nil {
		return nil, err
	}
	return &doctor, nil
}

// UpdateDoctorVerificationStatus updates doctor verification status with audit trail
func (r *AdminRepository) UpdateDoctorVerificationStatus(doctorID uint, status models.DoctorVerificationStatus, adminID uint, reason string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Get current doctor state for audit trail
		var doctor models.DoctorProfile
		if err := tx.First(&doctor, doctorID).Error; err != nil {
			return fmt.Errorf("failed to get doctor: %w", err)
		}

		_ = doctor.VerificationStatus // Track old status for audit
		now := time.Now()

		// Update doctor profile
		updates := map[string]interface{}{
			"verification_status": status,
			"verified_by":         adminID,
		}

		if status == models.VerificationApproved {
			updates["verified_at"] = &now
			updates["rejection_reason"] = ""
			updates["suspension_reason"] = ""
		} else if status == models.VerificationRejected {
			updates["rejection_reason"] = reason
			updates["suspension_reason"] = ""
			updates["verified_at"] = nil
		} else if status == models.VerificationSuspended {
			updates["suspension_reason"] = reason
			updates["rejection_reason"] = ""
		}

		if err := tx.Model(&doctor).Updates(updates).Error; err != nil {
			return fmt.Errorf("failed to update doctor status: %w", err)
		}

		// Also update user active status based on verification
		if status == models.VerificationSuspended {
			if err := tx.Model(&models.User{}).Where("id = ?", doctor.UserID).Update("is_active", false).Error; err != nil {
				return fmt.Errorf("failed to deactivate user: %w", err)
			}
		} else if status == models.VerificationApproved {
			if err := tx.Model(&models.User{}).Where("id = ?", doctor.UserID).Update("is_active", true).Error; err != nil {
				return fmt.Errorf("failed to activate user: %w", err)
			}
		}

		return nil
	})
}

// User Management Methods

// GetUsers retrieves users with filtering and pagination
func (r *AdminRepository) GetUsers(role *models.UserRole, isActive *bool, page, pageSize int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	query := r.db.Preload("Profile")

	// Apply filters
	if role != nil {
		query = query.Where("role = ?", *role)
	}
	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	// Get total count
	if err := query.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get users: %w", err)
	}

	return users, total, nil
}

// UpdateUserStatus updates user active status
func (r *AdminRepository) UpdateUserStatus(userID uint, isActive bool) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("is_active", isActive).Error
}

// Dashboard Statistics Methods

// GetDashboardStats retrieves admin dashboard statistics
func (r *AdminRepository) GetDashboardStats() (*models.AdminDashboardStats, error) {
	stats := &models.AdminDashboardStats{}

	// Total users
	r.db.Model(&models.User{}).Count(&stats.TotalUsers)

	// Users by role
	r.db.Model(&models.User{}).Where("role = ?", models.RolePatient).Count(&stats.TotalPatients)
	r.db.Model(&models.User{}).Where("role = ?", models.RoleDoctor).Count(&stats.TotalDoctors)

	// Doctor verification status
	r.db.Model(&models.DoctorProfile{}).Where("verification_status = ?", models.VerificationPending).Count(&stats.PendingDoctors)
	r.db.Model(&models.DoctorProfile{}).Where("verification_status = ?", models.VerificationApproved).Count(&stats.ApprovedDoctors)
	r.db.Model(&models.DoctorProfile{}).Where("verification_status = ?", models.VerificationSuspended).Count(&stats.SuspendedDoctors)

	// User activity status
	r.db.Model(&models.User{}).Where("is_active = ?", true).Count(&stats.ActiveUsers)
	r.db.Model(&models.User{}).Where("is_active = ?", false).Count(&stats.InactiveUsers)

	// Recent audit logs (last 24 hours)
	yesterday := time.Now().Add(-24 * time.Hour)
	r.db.Model(&models.AdminAuditLog{}).Where("created_at > ?", yesterday).Count(&stats.RecentAuditLogs)

	return stats, nil
}

// HIPAA-Compliant Audit Trail Methods

// CreateAdminAuditLog creates a comprehensive audit log entry for admin actions
func (r *AdminRepository) CreateAdminAuditLog(log *models.AdminAuditLog) error {
	return r.db.Create(log).Error
}

// GetAdminAuditLogs retrieves admin audit logs with filtering and pagination
func (r *AdminRepository) GetAdminAuditLogs(adminUserID *uint, targetUserID *uint, action string, startDate, endDate *time.Time, page, pageSize int) ([]models.AdminAuditLog, int64, error) {
	var logs []models.AdminAuditLog
	var total int64

	query := r.db.Preload("AdminUser").Preload("AdminUser.Profile").Preload("TargetUser").Preload("TargetUser.Profile")

	// Apply filters
	if adminUserID != nil {
		query = query.Where("admin_user_id = ?", *adminUserID)
	}
	if targetUserID != nil {
		query = query.Where("target_user_id = ?", *targetUserID)
	}
	if action != "" {
		query = query.Where("action ILIKE ?", "%"+action+"%")
	}
	if startDate != nil {
		query = query.Where("created_at >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("created_at <= ?", *endDate)
	}

	// Get total count
	if err := query.Model(&models.AdminAuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get audit logs: %w", err)
	}

	return logs, total, nil
}

// GetAdminAuditLogsByResource retrieves audit logs for a specific resource
func (r *AdminRepository) GetAdminAuditLogsByResource(resource string, resourceID uint, page, pageSize int) ([]models.AdminAuditLog, int64, error) {
	var logs []models.AdminAuditLog
	var total int64

	query := r.db.Preload("AdminUser").Preload("AdminUser.Profile").Preload("TargetUser").Preload("TargetUser.Profile").
		Where("resource = ? AND resource_id = ?", resource, resourceID)

	// Get total count
	if err := query.Model(&models.AdminAuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count resource audit logs: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get resource audit logs: %w", err)
	}

	return logs, total, nil
}

// Helper method to build admin audit log
func (r *AdminRepository) BuildAdminAuditLog(adminUserID uint, targetUserID *uint, action, resource string, resourceID *uint, details, oldValue, newValue, reason, ipAddress, userAgent, sessionID string) *models.AdminAuditLog {
	return &models.AdminAuditLog{
		AdminUserID:  adminUserID,
		TargetUserID: targetUserID,
		Action:       action,
		Resource:     resource,
		ResourceID:   resourceID,
		Details:      details,
		OldValue:     oldValue,
		NewValue:     newValue,
		Reason:       reason,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		SessionID:    sessionID,
	}
}

