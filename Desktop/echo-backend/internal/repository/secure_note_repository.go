package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

// SecureNoteRepository handles database operations for secure notes
type SecureNoteRepository struct {
	db *gorm.DB
}

// NewSecureNoteRepository creates a new secure note repository
func NewSecureNoteRepository(db *gorm.DB) *SecureNoteRepository {
	return &SecureNoteRepository{db: db}
}

// CreateSecureNote creates a new encrypted note
func (r *SecureNoteRepository) CreateSecureNote(note *models.SecureNote) error {
	return r.db.Create(note).Error
}

// GetSecureNoteByID retrieves a secure note by ID
func (r *SecureNoteRepository) GetSecureNoteByID(id uint) (*models.SecureNote, error) {
	var note models.SecureNote
	err := r.db.Preload("Doctor").Preload("Patient").Preload("Appointment").First(&note, id).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

// GetSecureNotesByAppointmentID retrieves all notes for an appointment
func (r *SecureNoteRepository) GetSecureNotesByAppointmentID(appointmentID uint) ([]models.SecureNote, error) {
	var notes []models.SecureNote
	err := r.db.Where("appointment_id = ? AND is_archived = ?", appointmentID, false).
		Preload("Doctor").Preload("Patient").
		Order("created_at DESC").Find(&notes).Error
	return notes, err
}

// GetSecureNotesByPatientID retrieves all notes for a patient
func (r *SecureNoteRepository) GetSecureNotesByPatientID(patientID uint, limit, offset int) ([]models.SecureNote, error) {
	var notes []models.SecureNote
	query := r.db.Where("patient_id = ? AND is_archived = ?", patientID, false).
		Preload("Doctor").Preload("Appointment").
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&notes).Error
	return notes, err
}

// GetSecureNotesByDoctorID retrieves all notes created by a doctor
func (r *SecureNoteRepository) GetSecureNotesByDoctorID(doctorID uint, limit, offset int) ([]models.SecureNote, error) {
	var notes []models.SecureNote
	query := r.db.Where("doctor_id = ? AND is_archived = ?", doctorID, false).
		Preload("Patient").Preload("Appointment").
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&notes).Error
	return notes, err
}

// UpdateSecureNote updates an existing secure note
func (r *SecureNoteRepository) UpdateSecureNote(note *models.SecureNote) error {
	return r.db.Save(note).Error
}

// ArchiveSecureNote marks a note as archived (soft delete alternative)
func (r *SecureNoteRepository) ArchiveSecureNote(id uint) error {
	return r.db.Model(&models.SecureNote{}).Where("id = ?", id).Update("is_archived", true).Error
}

// DeleteSecureNote permanently deletes a secure note (use with caution)
func (r *SecureNoteRepository) DeleteSecureNote(id uint) error {
	return r.db.Delete(&models.SecureNote{}, id).Error
}

// CreateSecureNoteAuditLog creates an audit log entry
func (r *SecureNoteRepository) CreateSecureNoteAuditLog(auditLog *models.SecureNoteAuditLog) error {
	return r.db.Create(auditLog).Error
}

// GetSecureNoteAuditLogs retrieves audit logs for a secure note
func (r *SecureNoteRepository) GetSecureNoteAuditLogs(secureNoteID uint) ([]models.SecureNoteAuditLog, error) {
	var auditLogs []models.SecureNoteAuditLog
	err := r.db.Where("secure_note_id = ?", secureNoteID).
		Preload("User").
		Order("created_at DESC").Find(&auditLogs).Error
	return auditLogs, err
}

// GetSecureNoteAuditLogsByUserID retrieves audit logs for a user's access
func (r *SecureNoteRepository) GetSecureNoteAuditLogsByUserID(userID uint, limit, offset int) ([]models.SecureNoteAuditLog, error) {
	var auditLogs []models.SecureNoteAuditLog
	query := r.db.Where("user_id = ?", userID).
		Preload("User").Preload("SecureNote").
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&auditLogs).Error
	return auditLogs, err
}

// SearchSecureNotes searches for notes (this would work on metadata, not encrypted content)
func (r *SecureNoteRepository) SearchSecureNotes(patientID *uint, doctorID *uint, noteType *models.NoteType, limit, offset int) ([]models.SecureNote, error) {
	query := r.db.Model(&models.SecureNote{}).Where("is_archived = ?", false)

	if patientID != nil {
		query = query.Where("patient_id = ?", *patientID)
	}
	if doctorID != nil {
		query = query.Where("doctor_id = ?", *doctorID)
	}
	if noteType != nil {
		query = query.Where("note_type = ?", *noteType)
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	var notes []models.SecureNote
	err := query.Preload("Doctor").Preload("Patient").Preload("Appointment").
		Order("created_at DESC").Find(&notes).Error
	return notes, err
}

// CountSecureNotesByPatient counts total notes for a patient
func (r *SecureNoteRepository) CountSecureNotesByPatient(patientID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.SecureNote{}).Where("patient_id = ? AND is_archived = ?", patientID, false).Count(&count).Error
	return count, err
}

// CountSecureNotesByDoctor counts total notes created by a doctor
func (r *SecureNoteRepository) CountSecureNotesByDoctor(doctorID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.SecureNote{}).Where("doctor_id = ? AND is_archived = ?", doctorID, false).Count(&count).Error
	return count, err
}

// GetSecureNotesRequiringKeyRotation finds notes encrypted with old keys
func (r *SecureNoteRepository) GetSecureNotesRequiringKeyRotation(excludeKeyID string, limit int) ([]models.SecureNote, error) {
	var notes []models.SecureNote
	query := r.db.Where("encryption_key_id != ? AND is_archived = ?", excludeKeyID, false)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&notes).Error
	return notes, err
}

