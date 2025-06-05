package services

import (
	"fmt"
	"time"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/encryption"
	"backend/pkg/logger"
)

// SecureNoteService handles encrypted doctor's notes with HIPAA compliance
type SecureNoteService struct {
	secureNoteRepo  *repository.SecureNoteRepository
	appointmentRepo *repository.AppointmentRepository
	userRepo        *repository.UserRepository
	encryption      *encryption.EncryptionService
	logger          *logger.Logger
}

// NewSecureNoteService creates a new secure note service
func NewSecureNoteService(secureNoteRepo *repository.SecureNoteRepository, appointmentRepo *repository.AppointmentRepository, userRepo *repository.UserRepository, encryption *encryption.EncryptionService, logger *logger.Logger) *SecureNoteService {
	return &SecureNoteService{
		secureNoteRepo:  secureNoteRepo,
		appointmentRepo: appointmentRepo,
		userRepo:        userRepo,
		encryption:      encryption,
		logger:          logger,
	}
}

// CreateSecureNote creates a new encrypted doctor's note
func (s *SecureNoteService) CreateSecureNote(doctorID uint, req *models.SecureNoteRequest, ipAddress, userAgent string) (*models.SecureNoteResponse, error) {
	// Verify appointment exists and doctor has access
	appointment, err := s.appointmentRepo.GetAppointmentByID(req.AppointmentID)
	if err != nil {
		return nil, fmt.Errorf("appointment not found: %w", err)
	}

	if appointment.DoctorID != doctorID {
		return nil, fmt.Errorf("access denied: doctor not assigned to this appointment")
	}

	// Encrypt the note content
	encryptedData, err := s.encryption.Encrypt(req.Content)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt note content: %w", err)
	}

	// Create secure note
	note := &models.SecureNote{
		AppointmentID:    req.AppointmentID,
		DoctorID:         doctorID,
		PatientID:        appointment.PatientID,
		EncryptedContent: encryptedData.EncryptedContent,
		ContentHash:      encryptedData.ContentHash,
		EncryptionKeyID:  encryptedData.KeyID,
		NoteType:         req.NoteType,
		IsArchived:       false,
	}

	if err := s.secureNoteRepo.CreateSecureNote(note); err != nil {
		return nil, fmt.Errorf("failed to create secure note: %w", err)
	}

	// Create audit log
	s.createAuditLog(note.ID, doctorID, "created", "", req.Content, req.AccessReason, ipAddress, userAgent)

	// Log security event (without content)
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "secure_note_created",
		UserID:    doctorID,
		UserRole:  "doctor",
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Secure note created for appointment %d, type: %s", req.AppointmentID, req.NoteType),
	})

	// Return decrypted response
	return s.buildSecureNoteResponse(note, req.Content)
}

// GetSecureNote retrieves and decrypts a secure note
func (s *SecureNoteService) GetSecureNote(noteID uint, userID uint, accessReason string, ipAddress, userAgent string) (*models.SecureNoteResponse, error) {
	// Get encrypted note
	note, err := s.secureNoteRepo.GetSecureNoteByID(noteID)
	if err != nil {
		return nil, fmt.Errorf("note not found: %w", err)
	}

	// Check access permissions
	if !s.hasNoteAccess(note, userID) {
		return nil, fmt.Errorf("access denied")
	}

	// Decrypt content
	encryptedData := &encryption.EncryptedData{
		EncryptedContent: note.EncryptedContent,
		ContentHash:      note.ContentHash,
		KeyID:            note.EncryptionKeyID,
	}

	content, err := s.encryption.Decrypt(encryptedData)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt note content: %w", err)
	}

	// Create audit log for access
	s.createAuditLog(noteID, userID, "accessed", "", content, accessReason, ipAddress, userAgent)

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "secure_note_accessed",
		UserID:    userID,
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Secure note %d accessed, reason: %s", noteID, encryption.SanitizeForLogging(accessReason)),
	})

	return s.buildSecureNoteResponse(note, content)
}

// UpdateSecureNote updates an existing secure note
func (s *SecureNoteService) UpdateSecureNote(noteID uint, userID uint, req *models.SecureNoteRequest, ipAddress, userAgent string) (*models.SecureNoteResponse, error) {
	// Get existing note
	note, err := s.secureNoteRepo.GetSecureNoteByID(noteID)
	if err != nil {
		return nil, fmt.Errorf("note not found: %w", err)
	}

	// Check permissions (only the creating doctor can update)
	if note.DoctorID != userID {
		return nil, fmt.Errorf("access denied: only the creating doctor can update this note")
	}

	// Decrypt old content for audit log
	oldEncryptedData := &encryption.EncryptedData{
		EncryptedContent: note.EncryptedContent,
		ContentHash:      note.ContentHash,
		KeyID:            note.EncryptionKeyID,
	}

	oldContent, err := s.encryption.Decrypt(oldEncryptedData)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt existing content: %w", err)
	}

	// Encrypt new content
	newEncryptedData, err := s.encryption.Encrypt(req.Content)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt new content: %w", err)
	}

	// Update note
	note.EncryptedContent = newEncryptedData.EncryptedContent
	note.ContentHash = newEncryptedData.ContentHash
	note.EncryptionKeyID = newEncryptedData.KeyID
	note.NoteType = req.NoteType
	note.UpdatedAt = time.Now()

	if err := s.secureNoteRepo.UpdateSecureNote(note); err != nil {
		return nil, fmt.Errorf("failed to update secure note: %w", err)
	}

	// Create audit log with old and new content
	s.createAuditLogWithOldValue(noteID, userID, "updated", oldContent, req.Content, req.AccessReason, ipAddress, userAgent)

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "secure_note_updated",
		UserID:    userID,
		UserRole:  "doctor",
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Secure note %d updated", noteID),
	})

	return s.buildSecureNoteResponse(note, req.Content)
}

// GetSecureNotesByAppointment retrieves all notes for an appointment
func (s *SecureNoteService) GetSecureNotesByAppointment(appointmentID uint, userID uint, accessReason string, ipAddress, userAgent string) ([]models.SecureNoteResponse, error) {
	// Verify appointment access
	appointment, err := s.appointmentRepo.GetAppointmentByID(appointmentID)
	if err != nil {
		return nil, fmt.Errorf("appointment not found: %w", err)
	}

	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return nil, fmt.Errorf("access denied")
	}

	// Get encrypted notes
	notes, err := s.secureNoteRepo.GetSecureNotesByAppointmentID(appointmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve notes: %w", err)
	}

	// Decrypt and build responses
	var responses []models.SecureNoteResponse
	for _, note := range notes {
		encryptedData := &encryption.EncryptedData{
			EncryptedContent: note.EncryptedContent,
			ContentHash:      note.ContentHash,
			KeyID:            note.EncryptionKeyID,
		}

		content, err := s.encryption.Decrypt(encryptedData)
		if err != nil {
			s.logger.Error(fmt.Sprintf("Failed to decrypt note %d: %v", note.ID, err))
			continue
		}

		// Create audit log for each note accessed
		s.createAuditLog(note.ID, userID, "accessed", "", content, accessReason, ipAddress, userAgent)

		response, err := s.buildSecureNoteResponse(&note, content)
		if err != nil {
			s.logger.Error(fmt.Sprintf("Failed to build response for note %d: %v", note.ID, err))
			continue
		}
		responses = append(responses, *response)
	}

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "secure_notes_batch_accessed",
		UserID:    userID,
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("%d secure notes accessed for appointment %d", len(responses), appointmentID),
	})

	return responses, nil
}

// GetSecureNotesByPatient retrieves all notes for a patient
func (s *SecureNoteService) GetSecureNotesByPatient(patientID uint, userID uint, accessReason string, limit, offset int, ipAddress, userAgent string) ([]models.SecureNoteResponse, error) {
	// Check permissions (patient can access their own notes, doctors need legitimate access)
	if patientID != userID {
		// Verify doctor has legitimate access to this patient
		user, err := s.userRepo.GetUserByID(userID)
		if err != nil || user.Role != "doctor" {
			return nil, fmt.Errorf("access denied")
		}
		// Additional verification could be added here (e.g., doctor-patient relationship)
	}

	// Get encrypted notes
	notes, err := s.secureNoteRepo.GetSecureNotesByPatientID(patientID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve notes: %w", err)
	}

	return s.decryptAndBuildResponses(notes, userID, accessReason, ipAddress, userAgent)
}

// ArchiveSecureNote archives a note (soft delete)
func (s *SecureNoteService) ArchiveSecureNote(noteID uint, userID uint, accessReason string, ipAddress, userAgent string) error {
	// Get note to verify permissions
	note, err := s.secureNoteRepo.GetSecureNoteByID(noteID)
	if err != nil {
		return fmt.Errorf("note not found: %w", err)
	}

	// Only the creating doctor can archive
	if note.DoctorID != userID {
		return fmt.Errorf("access denied: only the creating doctor can archive this note")
	}

	// Archive the note
	if err := s.secureNoteRepo.ArchiveSecureNote(noteID); err != nil {
		return fmt.Errorf("failed to archive note: %w", err)
	}

	// Create audit log
	s.createAuditLog(noteID, userID, "archived", "", "", accessReason, ipAddress, userAgent)

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "secure_note_archived",
		UserID:    userID,
		UserRole:  "doctor",
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Secure note %d archived", noteID),
	})

	return nil
}

// GetAuditLogs retrieves audit logs for a secure note
func (s *SecureNoteService) GetAuditLogs(noteID uint, userID uint, ipAddress string) ([]models.SecureNoteAuditLog, error) {
	// Verify access to the note
	note, err := s.secureNoteRepo.GetSecureNoteByID(noteID)
	if err != nil {
		return nil, fmt.Errorf("note not found: %w", err)
	}

	if !s.hasNoteAccess(note, userID) {
		return nil, fmt.Errorf("access denied")
	}

	// Get audit logs
	auditLogs, err := s.secureNoteRepo.GetSecureNoteAuditLogs(noteID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve audit logs: %w", err)
	}

	// Log the audit log access
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "secure_note_audit_accessed",
		UserID:    userID,
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Audit logs accessed for secure note %d", noteID),
	})

	return auditLogs, nil
}

// Helper methods

func (s *SecureNoteService) hasNoteAccess(note *models.SecureNote, userID uint) bool {
	// Patient can access their own notes
	if note.PatientID == userID {
		return true
	}
	// Doctor can access notes they created
	if note.DoctorID == userID {
		return true
	}
	// Additional access rules can be added here
	return false
}

func (s *SecureNoteService) buildSecureNoteResponse(note *models.SecureNote, content string) (*models.SecureNoteResponse, error) {
	response := &models.SecureNoteResponse{
		ID:            note.ID,
		AppointmentID: note.AppointmentID,
		Content:       content,
		NoteType:      note.NoteType,
		IsArchived:    note.IsArchived,
		CreatedAt:     note.CreatedAt,
		UpdatedAt:     note.UpdatedAt,
		Doctor:  models.NewUserSummary(note.Doctor),
		Patient: models.NewUserSummary(note.Patient),
	}

	if note.Appointment.ID != 0 {
		response.Appointment = models.AppointmentSummary{
			ID:              note.Appointment.ID,
			ScheduledAt:     note.Appointment.ScheduledAt,
			AppointmentType: note.Appointment.AppointmentType,
			Status:          note.Appointment.Status,
		}
	}

	return response, nil
}

func (s *SecureNoteService) decryptAndBuildResponses(notes []models.SecureNote, userID uint, accessReason string, ipAddress, userAgent string) ([]models.SecureNoteResponse, error) {
	var responses []models.SecureNoteResponse

	for _, note := range notes {
		encryptedData := &encryption.EncryptedData{
			EncryptedContent: note.EncryptedContent,
			ContentHash:      note.ContentHash,
			KeyID:            note.EncryptionKeyID,
		}

		content, err := s.encryption.Decrypt(encryptedData)
		if err != nil {
			s.logger.Error(fmt.Sprintf("Failed to decrypt note %d: %v", note.ID, err))
			continue
		}

		// Create audit log for access
		s.createAuditLog(note.ID, userID, "accessed", "", content, accessReason, ipAddress, userAgent)

		response, err := s.buildSecureNoteResponse(&note, content)
		if err != nil {
			s.logger.Error(fmt.Sprintf("Failed to build response for note %d: %v", note.ID, err))
			continue
		}
		responses = append(responses, *response)
	}

	return responses, nil
}

func (s *SecureNoteService) createAuditLog(secureNoteID, userID uint, action, oldValue, newValue, accessReason, ipAddress, userAgent string) {
	// Mask content for audit logs
	maskedOldValue := encryption.MaskContent(oldValue)
	maskedNewValue := encryption.MaskContent(newValue)

	auditLog := &models.SecureNoteAuditLog{
		SecureNoteID: secureNoteID,
		UserID:       userID,
		Action:       action,
		OldValue:     maskedOldValue,
		NewValue:     maskedNewValue,
		AccessReason: accessReason,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}

	if err := s.secureNoteRepo.CreateSecureNoteAuditLog(auditLog); err != nil {
		s.logger.Error("Failed to create secure note audit log: " + err.Error())
	}
}

func (s *SecureNoteService) createAuditLogWithOldValue(secureNoteID, userID uint, action, oldValue, newValue, accessReason, ipAddress, userAgent string) {
	s.createAuditLog(secureNoteID, userID, action, oldValue, newValue, accessReason, ipAddress, userAgent)
}

