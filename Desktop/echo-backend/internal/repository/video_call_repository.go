package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

// VideoCallRepository handles database operations for video calls
type VideoCallRepository struct {
	db *gorm.DB
}

// NewVideoCallRepository creates a new video call repository
func NewVideoCallRepository(db *gorm.DB) *VideoCallRepository {
	return &VideoCallRepository{db: db}
}

// CreateVideoCallSession creates a new video call session
func (r *VideoCallRepository) CreateVideoCallSession(session *models.VideoCallSession) error {
	return r.db.Create(session).Error
}

// GetVideoCallSessionByID retrieves a video call session by ID
func (r *VideoCallRepository) GetVideoCallSessionByID(id uint) (*models.VideoCallSession, error) {
	var session models.VideoCallSession
	err := r.db.Preload("Appointment").Preload("Participants.User.Profile").First(&session, id).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetVideoCallSessionByRoomSID retrieves a video call session by Twilio room SID
func (r *VideoCallRepository) GetVideoCallSessionByRoomSID(roomSID string) (*models.VideoCallSession, error) {
	var session models.VideoCallSession
	err := r.db.Where("room_sid = ?", roomSID).Preload("Appointment").First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetActiveSessionByAppointmentID retrieves active session for an appointment
func (r *VideoCallRepository) GetActiveSessionByAppointmentID(appointmentID uint) (*models.VideoCallSession, error) {
	var session models.VideoCallSession
	err := r.db.Where("appointment_id = ? AND status IN ?", appointmentID, []string{"pending", "active"}).
		Preload("Appointment").First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetVideoCallSessionsByAppointmentID retrieves all sessions for an appointment
func (r *VideoCallRepository) GetVideoCallSessionsByAppointmentID(appointmentID uint) ([]models.VideoCallSession, error) {
	var sessions []models.VideoCallSession
	err := r.db.Where("appointment_id = ?", appointmentID).
		Preload("Participants.User.Profile").
		Order("created_at DESC").Find(&sessions).Error
	return sessions, err
}

// UpdateVideoCallSession updates a video call session
func (r *VideoCallRepository) UpdateVideoCallSession(session *models.VideoCallSession) error {
	return r.db.Save(session).Error
}

// CreateVideoCallParticipant creates a new participant
func (r *VideoCallRepository) CreateVideoCallParticipant(participant *models.VideoCallParticipant) error {
	return r.db.Create(participant).Error
}

// GetParticipantBySessionAndUser retrieves a participant by session and user
func (r *VideoCallRepository) GetParticipantBySessionAndUser(sessionID, userID uint) (*models.VideoCallParticipant, error) {
	var participant models.VideoCallParticipant
	err := r.db.Where("video_call_session_id = ? AND user_id = ?", sessionID, userID).
		Preload("User.Profile").First(&participant).Error
	if err != nil {
		return nil, err
	}
	return &participant, nil
}

// UpdateVideoCallParticipant updates a participant
func (r *VideoCallRepository) UpdateVideoCallParticipant(participant *models.VideoCallParticipant) error {
	return r.db.Save(participant).Error
}

// CreateVideoCallAuditLog creates an audit log entry
func (r *VideoCallRepository) CreateVideoCallAuditLog(auditLog *models.VideoCallAuditLog) error {
	return r.db.Create(auditLog).Error
}

