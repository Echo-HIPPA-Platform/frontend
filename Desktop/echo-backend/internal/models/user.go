package models

import (
	"time"

	"gorm.io/gorm"
)

// UserRole defines the user roles in the system
type UserRole string

const (
	RolePatient UserRole = "patient"
	RoleDoctor  UserRole = "doctor"
	RoleAdmin   UserRole = "admin"
)

// User represents the main user entity
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
	Password  string         `json:"-" gorm:"not null" validate:"required,min=8"` // Never expose in JSON
	Role      UserRole       `json:"role" gorm:"not null" validate:"required,oneof=patient doctor admin"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"` // Soft delete for HIPAA compliance

	// Relationships
	Profile UserProfile `json:"profile,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// UserProfile contains personal information (PHI)
type UserProfile struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"uniqueIndex;not null"`
	FirstName   string    `json:"first_name" validate:"required,min=2,max=50"`
	LastName    string    `json:"last_name" validate:"required,min=2,max=50"`
	DateOfBirth *time.Time `json:"date_of_birth,omitempty" gorm:"type:date"`
	Phone       string    `json:"phone,omitempty" validate:"omitempty,min=10,max=15"`
	Address     string    `json:"address,omitempty" validate:"omitempty,max=255"`
	City        string    `json:"city,omitempty" validate:"omitempty,max=100"`
	State       string    `json:"state,omitempty" validate:"omitempty,max=50"`
	ZipCode     string    `json:"zip_code,omitempty" validate:"omitempty,max=10"`
	Country     string    `json:"country,omitempty" validate:"omitempty,max=50"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// DoctorVerificationStatus defines the verification states for doctors
type DoctorVerificationStatus string

const (
	VerificationPending   DoctorVerificationStatus = "pending"
	VerificationApproved  DoctorVerificationStatus = "approved"
	VerificationRejected  DoctorVerificationStatus = "rejected"
	VerificationSuspended DoctorVerificationStatus = "suspended"
)

// DoctorProfile contains additional information for doctors
type DoctorProfile struct {
	ID                 uint                      `json:"id" gorm:"primaryKey"`
	UserID             uint                      `json:"user_id" gorm:"uniqueIndex;not null"`
	LicenseNumber      string                    `json:"license_number" validate:"required"`
	Specialization     string                    `json:"specialization" validate:"required"`
	YearsOfExp         int                       `json:"years_of_experience" validate:"min=0"`
	Education          string                    `json:"education,omitempty"`
	Bio                string                    `json:"bio,omitempty" validate:"max=1000"`
	VerificationStatus DoctorVerificationStatus `json:"verification_status" gorm:"default:pending"`
	VerifiedAt         *time.Time                `json:"verified_at,omitempty"`
	VerifiedBy         *uint                     `json:"verified_by,omitempty"` // Admin user ID
	RejectionReason    string                    `json:"rejection_reason,omitempty"`
	SuspensionReason   string                    `json:"suspension_reason,omitempty"`
	CreatedAt          time.Time                 `json:"created_at"`
	UpdatedAt          time.Time                 `json:"updated_at"`

	// Relationships
	User        User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
	VerifierUser *User `json:"verifier_user,omitempty" gorm:"foreignKey:VerifiedBy"`
}

// AuditLog tracks all user actions for HIPAA compliance
type AuditLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	Action    string    `json:"action" gorm:"not null"`
	Resource  string    `json:"resource,omitempty"`
	Details   string    `json:"details,omitempty"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`

	// Relationship
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// UserSession tracks active user sessions
type UserSession struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"not null"`
	Token      string    `json:"-" gorm:"uniqueIndex;not null"` // JWT token hash
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
	ExpiresAt  time.Time `json:"expires_at"`
	IsRevoked  bool      `json:"is_revoked" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`

	// Relationship
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// DTO structures for API responses (no sensitive data)
type UserResponse struct {
	ID       uint        `json:"id"`
	Email    string      `json:"email"`
	Role     UserRole    `json:"role"`
	IsActive bool        `json:"is_active"`
	Profile  UserProfile `json:"profile,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type RegisterRequest struct {
	Email     string   `json:"email" validate:"required,email"`
	Password  string   `json:"password" validate:"required,min=8,max=128"`
	Role      UserRole `json:"role" validate:"required,oneof=patient doctor"`
	FirstName string   `json:"first_name" validate:"required,min=2,max=50"`
	LastName  string   `json:"last_name" validate:"required,min=2,max=50"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UpdateProfileRequest struct {
	FirstName   string     `json:"first_name,omitempty" validate:"omitempty,min=2,max=50"`
	LastName    string     `json:"last_name,omitempty" validate:"omitempty,min=2,max=50"`
	DateOfBirth *time.Time `json:"date_of_birth,omitempty"`
	Phone       string     `json:"phone,omitempty" validate:"omitempty,min=10,max=15"`
	Address     string     `json:"address,omitempty" validate:"omitempty,max=255"`
	City        string     `json:"city,omitempty" validate:"omitempty,max=100"`
	State       string     `json:"state,omitempty" validate:"omitempty,max=50"`
	ZipCode     string     `json:"zip_code,omitempty" validate:"omitempty,max=10"`
	Country     string     `json:"country,omitempty" validate:"omitempty,max=50"`
}

// Helper methods
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:       u.ID,
		Email:    u.Email,
		Role:     u.Role,
		IsActive: u.IsActive,
		Profile:  u.Profile,
	}
}

func (ur UserRole) IsValid() bool {
	return ur == RolePatient || ur == RoleDoctor || ur == RoleAdmin
}

func (ur UserRole) String() string {
    return string(ur)
}

// Admin-specific DTOs and requests

// DoctorResponse contains doctor information for admin views
type DoctorResponse struct {
    ID                 uint                      `json:"id"`
    User               UserResponse              `json:"user"`
    LicenseNumber      string                    `json:"license_number"`
    Specialization     string                    `json:"specialization"`
    YearsOfExp         int                       `json:"years_of_experience"`
    Education          string                    `json:"education"`
    Bio                string                    `json:"bio"`
    VerificationStatus DoctorVerificationStatus  `json:"verification_status"`
    VerifiedAt         *time.Time                `json:"verified_at"`
    VerifiedBy         *uint                     `json:"verified_by"`
    RejectionReason    string                    `json:"rejection_reason,omitempty"`
    SuspensionReason   string                    `json:"suspension_reason,omitempty"`
    CreatedAt          time.Time                 `json:"created_at"`
    UpdatedAt          time.Time                 `json:"updated_at"`
}

// DoctorVerificationRequest for admin actions on doctors
type DoctorVerificationRequest struct {
    Action DoctorVerificationStatus `json:"action" validate:"required,oneof=approved rejected suspended"`
    Reason string                   `json:"reason,omitempty" validate:"max=500"`
}

// DoctorListResponse for paginated doctor listing
type DoctorListResponse struct {
    Doctors    []DoctorResponse `json:"doctors"`
    Total      int64            `json:"total"`
    Page       int              `json:"page"`
    PageSize   int              `json:"page_size"`
    TotalPages int              `json:"total_pages"`
}

// UserListResponse for paginated user listing
type UserListResponse struct {
    Users      []UserResponse `json:"users"`
    Total      int64          `json:"total"`
    Page       int            `json:"page"`
    PageSize   int            `json:"page_size"`
    TotalPages int            `json:"total_pages"`
}

// AdminAuditLog extends AuditLog for HIPAA-compliant admin action tracking
type AdminAuditLog struct {
    ID           uint      `json:"id" gorm:"primaryKey"`
    AdminUserID  uint      `json:"admin_user_id" gorm:"not null"`
    TargetUserID *uint     `json:"target_user_id,omitempty"`
    Action       string    `json:"action" gorm:"not null"`
    Resource     string    `json:"resource" gorm:"not null"`
    ResourceID   *uint     `json:"resource_id,omitempty"`
    Details      string    `json:"details"`
    OldValue     string    `json:"old_value,omitempty"`  // Previous state for data changes
    NewValue     string    `json:"new_value,omitempty"`  // New state for data changes
    IPAddress    string    `json:"ip_address"`
    UserAgent    string    `json:"user_agent"`
    SessionID    string    `json:"session_id,omitempty"` // For session tracking
    Reason       string    `json:"reason,omitempty"`     // Business reason for the action
    CreatedAt    time.Time `json:"created_at"`

    // Relationships
    AdminUser  User  `json:"admin_user,omitempty" gorm:"foreignKey:AdminUserID"`
    TargetUser *User `json:"target_user,omitempty" gorm:"foreignKey:TargetUserID"`
}

// AdminAuditLogResponse for API responses
type AdminAuditLogResponse struct {
    ID           uint      `json:"id"`
    AdminUser    UserResponse `json:"admin_user"`
    TargetUser   *UserResponse `json:"target_user,omitempty"`
    Action       string    `json:"action"`
    Resource     string    `json:"resource"`
    ResourceID   *uint     `json:"resource_id,omitempty"`
    Details      string    `json:"details"`
    OldValue     string    `json:"old_value,omitempty"`
    NewValue     string    `json:"new_value,omitempty"`
    IPAddress    string    `json:"ip_address"`
    Reason       string    `json:"reason,omitempty"`
    CreatedAt    time.Time `json:"created_at"`
}

// AdminDashboardStats for admin dashboard overview
type AdminDashboardStats struct {
    TotalUsers        int64 `json:"total_users"`
    TotalPatients     int64 `json:"total_patients"`
    TotalDoctors      int64 `json:"total_doctors"`
    PendingDoctors    int64 `json:"pending_doctors"`
    ApprovedDoctors   int64 `json:"approved_doctors"`
    SuspendedDoctors  int64 `json:"suspended_doctors"`
    ActiveUsers       int64 `json:"active_users"`
    InactiveUsers     int64 `json:"inactive_users"`
    RecentAuditLogs   int64 `json:"recent_audit_logs"`
}

// Helper methods for verification status
func (dvs DoctorVerificationStatus) IsValid() bool {
    return dvs == VerificationPending || dvs == VerificationApproved || 
           dvs == VerificationRejected || dvs == VerificationSuspended
}

func (dvs DoctorVerificationStatus) String() string {
    return string(dvs)
}

// Helper method to convert DoctorProfile to DoctorResponse
func (dp *DoctorProfile) ToResponse() DoctorResponse {
    return DoctorResponse{
        ID:                 dp.ID,
        User:               dp.User.ToResponse(),
        LicenseNumber:      dp.LicenseNumber,
        Specialization:     dp.Specialization,
        YearsOfExp:         dp.YearsOfExp,
        Education:          dp.Education,
        Bio:                dp.Bio,
        VerificationStatus: dp.VerificationStatus,
        VerifiedAt:         dp.VerifiedAt,
        VerifiedBy:         dp.VerifiedBy,
        RejectionReason:    dp.RejectionReason,
        SuspensionReason:   dp.SuspensionReason,
        CreatedAt:          dp.CreatedAt,
        UpdatedAt:          dp.UpdatedAt,
    }
}

