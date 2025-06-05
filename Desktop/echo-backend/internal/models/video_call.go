package models

import (
	"fmt"
	"time"
	"gorm.io/gorm"
)

// VideoCallSession represents a video call session
type VideoCallSession struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	AppointmentID    uint      `json:"appointment_id" gorm:"not null;index"`
	RoomSID          string    `json:"-" gorm:"size:100;not null;index"` // Twilio Room SID (hidden from JSON)
	RoomName         string    `json:"room_name" gorm:"size:100;not null;index"`
	Status           CallStatus `json:"status" gorm:"size:20;not null"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	EndedAt          *time.Time `json:"ended_at,omitempty"`
	DurationSeconds  int       `json:"duration_seconds,omitempty" gorm:"default:0"`
	RecordingEnabled bool      `json:"recording_enabled" gorm:"default:false"`
	RecordingSID     string    `json:"-" gorm:"size:100"` // Twilio Recording SID (hidden)
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Appointment   Appointment             `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
	Participants  []VideoCallParticipant  `json:"participants,omitempty" gorm:"foreignKey:VideoCallSessionID"`
	AuditLogs     []VideoCallAuditLog     `json:"-" gorm:"foreignKey:VideoCallSessionID"`
}

// CallStatus represents the status of a video call
type CallStatus string

const (
	CallStatusPending    CallStatus = "pending"     // Session created, waiting to start
	CallStatusActive     CallStatus = "active"      // Call is in progress
	CallStatusCompleted  CallStatus = "completed"   // Call ended normally
	CallStatusFailed     CallStatus = "failed"      // Call failed to start or had errors
	CallStatusCanceled   CallStatus = "canceled"    // Call was canceled before starting
	CallStatusTimeout    CallStatus = "timeout"     // Call timed out
)

// VideoCallParticipant represents a participant in a video call
type VideoCallParticipant struct {
	ID                  uint       `json:"id" gorm:"primaryKey"`
	VideoCallSessionID  uint       `json:"video_call_session_id" gorm:"not null;index"`
	UserID              uint       `json:"user_id" gorm:"not null;index"`
	AccessToken         string     `json:"-" gorm:"type:text"` // JWT token for Twilio (hidden)
	TokenExpiresAt      time.Time  `json:"-"`                  // Token expiration (hidden)
	ParticipantSID      string     `json:"-" gorm:"size:100"`  // Twilio Participant SID (hidden)
	JoinedAt            *time.Time `json:"joined_at,omitempty"`
	LeftAt              *time.Time `json:"left_at,omitempty"`
	ConnectionQuality   string     `json:"connection_quality,omitempty" gorm:"size:20"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`

	// Relationships
	VideoCallSession VideoCallSession `json:"-" gorm:"foreignKey:VideoCallSessionID"`
	User             User             `json:"user" gorm:"foreignKey:UserID"`
}

// VideoCallAuditLog tracks all video call activities for compliance
type VideoCallAuditLog struct {
	ID                 uint      `json:"id" gorm:"primaryKey"`
	VideoCallSessionID uint      `json:"video_call_session_id" gorm:"not null;index"`
	UserID             *uint     `json:"user_id,omitempty" gorm:"index"` // Nullable for system events
	Action             string    `json:"action" gorm:"size:50;not null"`
	Details            string    `json:"details" gorm:"type:text"`
	IPAddress          string    `json:"ip_address" gorm:"size:45"`
	UserAgent          string    `json:"user_agent" gorm:"size:500"`
	CreatedAt          time.Time `json:"created_at"`

	// Relationships
	VideoCallSession VideoCallSession `json:"-" gorm:"foreignKey:VideoCallSessionID"`
	User             *User            `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Video call request/response models

// CreateVideoCallRequest represents a request to create a video call session
type CreateVideoCallRequest struct {
	AppointmentID    uint `json:"appointment_id" binding:"required"`
	RecordingEnabled bool `json:"recording_enabled"`
}

// VideoCallTokenRequest represents a request for a video call access token
type VideoCallTokenRequest struct {
	SessionID uint `json:"session_id" binding:"required"`
}

// VideoCallResponse represents the response when creating/getting a video call
type VideoCallResponse struct {
	ID              uint                      `json:"id"`
	AppointmentID   uint                      `json:"appointment_id"`
	RoomName        string                    `json:"room_name"`
	Status          CallStatus                `json:"status"`
	StartedAt       *time.Time                `json:"started_at,omitempty"`
	EndedAt         *time.Time                `json:"ended_at,omitempty"`
	DurationSeconds int                       `json:"duration_seconds,omitempty"`
	CreatedAt       time.Time                 `json:"created_at"`
	Appointment     AppointmentSummary        `json:"appointment"`
	Participants    []VideoCallParticipantResponse `json:"participants,omitempty"`
}

// VideoCallParticipantResponse represents a participant in the API response
type VideoCallParticipantResponse struct {
	ID                uint       `json:"id"`
	UserID            uint       `json:"user_id"`
	JoinedAt          *time.Time `json:"joined_at,omitempty"`
	LeftAt            *time.Time `json:"left_at,omitempty"`
	ConnectionQuality string     `json:"connection_quality,omitempty"`
	User              UserSummary `json:"user"`
}

// VideoCallTokenResponse represents the response containing access token
type VideoCallTokenResponse struct {
	AccessToken string    `json:"access_token"`
	RoomName    string    `json:"room_name"`
	ExpiresAt   time.Time `json:"expires_at"`
	Identity    string    `json:"identity"` // User identifier for Twilio
}

// VideoCallStatsRequest represents a request to update call statistics
type VideoCallStatsRequest struct {
	ConnectionQuality string `json:"connection_quality"`
	DurationSeconds   int    `json:"duration_seconds"`
}

// Validation methods

// Validate validates the create video call request
func (r *CreateVideoCallRequest) Validate() error {
	if r.AppointmentID == 0 {
		return fmt.Errorf("appointment_id is required")
	}
	return nil
}

// Validate validates the video call token request
func (r *VideoCallTokenRequest) Validate() error {
	if r.SessionID == 0 {
		return fmt.Errorf("session_id is required")
	}
	return nil
}

// Helper methods

// ToResponse converts VideoCallSession to VideoCallResponse
func (v *VideoCallSession) ToResponse() VideoCallResponse {
	response := VideoCallResponse{
		ID:              v.ID,
		AppointmentID:   v.AppointmentID,
		RoomName:        v.RoomName,
		Status:          v.Status,
		StartedAt:       v.StartedAt,
		EndedAt:         v.EndedAt,
		DurationSeconds: v.DurationSeconds,
		CreatedAt:       v.CreatedAt,
	}

	// Add appointment summary if loaded
	if v.Appointment.ID != 0 {
		response.Appointment = AppointmentSummary{
			ID:              v.Appointment.ID,
			ScheduledAt:     v.Appointment.ScheduledAt,
			AppointmentType: v.Appointment.AppointmentType,
			Status:          v.Appointment.Status,
		}
	}

	// Add participants if loaded
	for _, participant := range v.Participants {
		response.Participants = append(response.Participants, VideoCallParticipantResponse{
			ID:                participant.ID,
			UserID:            participant.UserID,
			JoinedAt:          participant.JoinedAt,
			LeftAt:            participant.LeftAt,
			ConnectionQuality: participant.ConnectionQuality,
			User: NewUserSummary(participant.User),
		})
	}

	return response
}

// IsActive checks if the video call session is currently active
func (v *VideoCallSession) IsActive() bool {
	return v.Status == CallStatusActive
}

// CanJoin checks if a user can join this video call session
func (v *VideoCallSession) CanJoin() bool {
	return v.Status == CallStatusPending || v.Status == CallStatusActive
}

// GetDurationSeconds calculates the duration of the call in seconds
func (v *VideoCallSession) GetDurationSeconds() int {
	if v.StartedAt == nil {
		return 0
	}
	
	endTime := time.Now()
	if v.EndedAt != nil {
		endTime = *v.EndedAt
	}
	
	return int(endTime.Sub(*v.StartedAt).Seconds())
}

// Table names
func (VideoCallSession) TableName() string {
	return "video_call_sessions"
}

func (VideoCallParticipant) TableName() string {
	return "video_call_participants"
}

func (VideoCallAuditLog) TableName() string {
	return "video_call_audit_logs"
}

