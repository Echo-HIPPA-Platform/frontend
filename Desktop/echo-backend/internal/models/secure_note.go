package models

import (
	"fmt"
	"time"
	"gorm.io/gorm"
)

// SecureNote represents an encrypted doctor's note
type SecureNote struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	AppointmentID    uint      `json:"appointment_id" gorm:"not null;index"`
	DoctorID         uint      `json:"doctor_id" gorm:"not null;index"`
	PatientID        uint      `json:"patient_id" gorm:"not null;index"`
	EncryptedContent string    `json:"-" gorm:"type:text;not null"` // Hidden from JSON
	ContentHash      string    `json:"-" gorm:"size:64;not null"`   // For integrity verification
	EncryptionKeyID  string    `json:"-" gorm:"size:36;not null"`   // Key identifier for rotation
	NoteType         NoteType  `json:"note_type" gorm:"size:50;not null"`
	IsArchived       bool      `json:"is_archived" gorm:"default:false"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Appointment Appointment `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
	Doctor      User        `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	Patient     User        `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	AuditLogs   []SecureNoteAuditLog `json:"-" gorm:"foreignKey:SecureNoteID"`
}

// NoteType defines the type of medical note
type NoteType string

const (
	NoteTypeConsultation NoteType = "consultation"
	NoteTypeDiagnosis    NoteType = "diagnosis"
	NoteTypeTreatment    NoteType = "treatment"
	NoteTypeProgress     NoteType = "progress"
	NoteTypePrescription NoteType = "prescription"
	NoteTypeReferral     NoteType = "referral"
	NoteTypeFollowUp     NoteType = "follow_up"
)

// SecureNoteAuditLog tracks all access and modifications to secure notes
type SecureNoteAuditLog struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	SecureNoteID uint      `json:"secure_note_id" gorm:"not null;index"`
	UserID       uint      `json:"user_id" gorm:"not null"`
	Action       string    `json:"action" gorm:"size:50;not null"` // created, accessed, updated, archived, deleted
	OldValue     string    `json:"-" gorm:"type:text"`             // Encrypted old content for updates
	NewValue     string    `json:"-" gorm:"type:text"`             // Encrypted new content for updates
	AccessReason string    `json:"access_reason" gorm:"size:255"`  // Required reason for access
	IPAddress    string    `json:"ip_address" gorm:"size:45"`
	UserAgent    string    `json:"user_agent" gorm:"size:500"`
	CreatedAt    time.Time `json:"created_at"`

	// Relationships
	SecureNote SecureNote `json:"-" gorm:"foreignKey:SecureNoteID"`
	User       User       `json:"user" gorm:"foreignKey:UserID"`
}

// SecureNoteRequest represents a request to create or update a secure note
type SecureNoteRequest struct {
	AppointmentID uint     `json:"appointment_id" binding:"required"`
	Content       string   `json:"content" binding:"required,min=1,max=10000"`
	NoteType      NoteType `json:"note_type" binding:"required"`
	AccessReason  string   `json:"access_reason" binding:"required,min=5,max=255"`
}

// SecureNoteResponse represents the response for a secure note (with decrypted content)
type SecureNoteResponse struct {
	ID            uint                 `json:"id"`
	AppointmentID uint                 `json:"appointment_id"`
	Content       string               `json:"content"`
	NoteType      NoteType             `json:"note_type"`
	IsArchived    bool                 `json:"is_archived"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
	Doctor        UserSummary          `json:"doctor"`
	Patient       UserSummary          `json:"patient"`
	Appointment   AppointmentSummary   `json:"appointment,omitempty"`
}

// SecureNoteAccessRequest represents a request to access a secure note
type SecureNoteAccessRequest struct {
	AccessReason string `json:"access_reason" binding:"required,min=5,max=255"`
}

// Validate validates the secure note request
func (r *SecureNoteRequest) Validate() error {
	validNoteTypes := map[NoteType]bool{
		NoteTypeConsultation: true,
		NoteTypeDiagnosis:    true,
		NoteTypeTreatment:    true,
		NoteTypeProgress:     true,
		NoteTypePrescription: true,
		NoteTypeReferral:     true,
		NoteTypeFollowUp:     true,
	}

	if !validNoteTypes[r.NoteType] {
		return fmt.Errorf("invalid note type: %s", r.NoteType)
	}

	return nil
}

// TableName returns the table name for SecureNote
func (SecureNote) TableName() string {
	return "secure_notes"
}

// TableName returns the table name for SecureNoteAuditLog
func (SecureNoteAuditLog) TableName() string {
	return "secure_note_audit_logs"
}

// UserSummary provides non-sensitive user information for notes
type UserSummary struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Helper method to create UserSummary from User
func NewUserSummary(user User) UserSummary {
	return UserSummary{
		ID:        user.ID,
		FirstName: user.Profile.FirstName,
		LastName:  user.Profile.LastName,
	}
}

// AppointmentSummary provides basic appointment information
type AppointmentSummary struct {
	ID              uint              `json:"id"`
	ScheduledAt     time.Time         `json:"scheduled_at"`
	AppointmentType AppointmentType   `json:"appointment_type"`
	Status          AppointmentStatus `json:"status"`
}

