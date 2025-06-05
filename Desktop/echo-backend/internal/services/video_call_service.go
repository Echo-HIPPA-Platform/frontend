package services

import (
	"fmt"
	"time"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/logger"
	"backend/pkg/twilio"
)

// VideoCallService handles video call business logic
type VideoCallService struct {
	videoCallRepo   *repository.VideoCallRepository
	appointmentRepo *repository.AppointmentRepository
	userRepo        *repository.UserRepository
	twiLioService   *twilio.VideoService
	logger          *logger.Logger
}

// NewVideoCallService creates a new video call service
func NewVideoCallService(videoCallRepo *repository.VideoCallRepository, appointmentRepo *repository.AppointmentRepository, userRepo *repository.UserRepository, twilioService *twilio.VideoService, logger *logger.Logger) *VideoCallService {
	return &VideoCallService{
		videoCallRepo:   videoCallRepo,
		appointmentRepo: appointmentRepo,
		userRepo:        userRepo,
		twiLioService:   twilioService,
		logger:          logger,
	}
}

// CreateVideoCallSession creates a new video call session for an appointment
func (s *VideoCallService) CreateVideoCallSession(userID uint, req *models.CreateVideoCallRequest, ipAddress, userAgent string) (*models.VideoCallResponse, error) {
	// Verify appointment exists and user has access
	appointment, err := s.appointmentRepo.GetAppointmentByID(req.AppointmentID)
	if err != nil {
		return nil, fmt.Errorf("appointment not found: %w", err)
	}

	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return nil, fmt.Errorf("access denied: user not associated with this appointment")
	}

	// Check if appointment is scheduled for today or is currently happening
	now := time.Now()
	appointmentDate := appointment.ScheduledAt.Truncate(24 * time.Hour)
	todayDate := now.Truncate(24 * time.Hour)

	if appointmentDate.After(todayDate.Add(24 * time.Hour)) {
		return nil, fmt.Errorf("video call can only be created on the day of appointment")
	}

	// Check if there's already an active session for this appointment
	existingSession, err := s.videoCallRepo.GetActiveSessionByAppointmentID(req.AppointmentID)
	if err == nil && existingSession != nil {
		response := existingSession.ToResponse()
		return &response, nil // Return existing active session
	}

	// Generate unique room name
	roomName := twilio.GenerateRoomName(req.AppointmentID)

	// Create Twilio room
	roomOptions := twilio.RoomOptions{
		UniqueName:         roomName,
		Type:              "group",
		RecordParticipants: req.RecordingEnabled,
		MaxParticipants:   2, // Doctor and patient only
		Timeout:           3600, // 1 hour timeout
	}

	twiLioRoom, err := s.twiLioService.CreateRoom(roomOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to create video room: %w", err)
	}

	// Create video call session in database
	session := &models.VideoCallSession{
		AppointmentID:    req.AppointmentID,
		RoomSID:          *twiLioRoom.Sid,
		RoomName:         roomName,
		Status:           models.CallStatusPending,
		RecordingEnabled: req.RecordingEnabled,
	}

	if err := s.videoCallRepo.CreateVideoCallSession(session); err != nil {
		return nil, fmt.Errorf("failed to create video call session: %w", err)
	}

	// Create participants for doctor and patient
	if err := s.createParticipants(session.ID, appointment.DoctorID, appointment.PatientID); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to create participants: %v", err))
		// Continue anyway, participants can be created when they request tokens
	}

	// Create audit log
	s.createAuditLog(session.ID, userID, "session_created", fmt.Sprintf("Video call session created for appointment %d", req.AppointmentID), ipAddress, userAgent)

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "video_call_session_created",
		UserID:    userID,
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Video call session created for appointment %d", req.AppointmentID),
	})

	// Load full session data
	fullSession, err := s.videoCallRepo.GetVideoCallSessionByID(session.ID)
	if err != nil {
		return nil, err
	}

	response := fullSession.ToResponse()
	return &response, nil
}

// GenerateAccessToken generates a short-lived access token for a participant
func (s *VideoCallService) GenerateAccessToken(userID uint, sessionID uint, ipAddress, userAgent string) (*models.VideoCallTokenResponse, error) {
	// Get video call session
	session, err := s.videoCallRepo.GetVideoCallSessionByID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("video call session not found: %w", err)
	}

	// Verify user has access to this session
	participant, err := s.videoCallRepo.GetParticipantBySessionAndUser(sessionID, userID)
	if err != nil {
		// Try to create participant if they don't exist but have access to the appointment
		appointment, err := s.appointmentRepo.GetAppointmentByID(session.AppointmentID)
		if err != nil {
			return nil, fmt.Errorf("appointment not found: %w", err)
		}

		if appointment.PatientID != userID && appointment.DoctorID != userID {
			return nil, fmt.Errorf("access denied: user not associated with this appointment")
		}

		// Create participant
		participant = &models.VideoCallParticipant{
			VideoCallSessionID: sessionID,
			UserID:             userID,
		}

		if err := s.videoCallRepo.CreateVideoCallParticipant(participant); err != nil {
			return nil, fmt.Errorf("failed to create participant: %w", err)
		}
	}

	// Check if session can be joined
	if !session.CanJoin() {
		return nil, fmt.Errorf("video call session cannot be joined (status: %s)", session.Status)
	}

	// Get user information
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Generate Twilio identity
	identity := twilio.GenerateIdentity(userID, string(user.Role))

	// Generate access token with 1-hour expiration
	tokenOptions := twilio.TokenOptions{
		Identity: identity,
		RoomName: session.RoomName,
		TTL:      time.Hour,
	}

	accessToken, err := s.twiLioService.GenerateAccessToken(tokenOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Update participant with token information
	expiresAt := time.Now().Add(time.Hour)
	participant.AccessToken = accessToken
	participant.TokenExpiresAt = expiresAt

	if err := s.videoCallRepo.UpdateVideoCallParticipant(participant); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to update participant token: %v", err))
	}

	// Create audit log
	s.createAuditLog(sessionID, userID, "token_generated", fmt.Sprintf("Access token generated for user %s", identity), ipAddress, userAgent)

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "video_call_token_generated",
		UserID:    userID,
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Video call access token generated for session %d", sessionID),
	})

	return &models.VideoCallTokenResponse{
		AccessToken: accessToken,
		RoomName:    session.RoomName,
		ExpiresAt:   expiresAt,
		Identity:    identity,
	}, nil
}

// GetVideoCallSession retrieves a video call session
func (s *VideoCallService) GetVideoCallSession(sessionID uint, userID uint) (*models.VideoCallResponse, error) {
	session, err := s.videoCallRepo.GetVideoCallSessionByID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("video call session not found: %w", err)
	}

	// Verify user has access
	if session.Appointment.PatientID != userID && session.Appointment.DoctorID != userID {
		return nil, fmt.Errorf("access denied")
	}

	response := session.ToResponse()
	return &response, nil
}

// StartVideoCall marks a video call as started
func (s *VideoCallService) StartVideoCall(sessionID uint, userID uint, ipAddress, userAgent string) error {
	session, err := s.videoCallRepo.GetVideoCallSessionByID(sessionID)
	if err != nil {
		return fmt.Errorf("video call session not found: %w", err)
	}

	// Verify user has access
	if session.Appointment.PatientID != userID && session.Appointment.DoctorID != userID {
		return fmt.Errorf("access denied")
	}

	// Update session status
	now := time.Now()
	session.Status = models.CallStatusActive
	session.StartedAt = &now

	if err := s.videoCallRepo.UpdateVideoCallSession(session); err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	// Update participant joined time
	participant, err := s.videoCallRepo.GetParticipantBySessionAndUser(sessionID, userID)
	if err == nil {
		participant.JoinedAt = &now
		s.videoCallRepo.UpdateVideoCallParticipant(participant)
	}

	// Create audit log
	s.createAuditLog(sessionID, userID, "call_started", "Video call started", ipAddress, userAgent)

	return nil
}

// EndVideoCall ends a video call session
func (s *VideoCallService) EndVideoCall(sessionID uint, userID uint, ipAddress, userAgent string) error {
	session, err := s.videoCallRepo.GetVideoCallSessionByID(sessionID)
	if err != nil {
		return fmt.Errorf("video call session not found: %w", err)
	}

	// Verify user has access
	if session.Appointment.PatientID != userID && session.Appointment.DoctorID != userID {
		return fmt.Errorf("access denied")
	}

	// End the Twilio room
	if err := s.twiLioService.EndRoom(session.RoomSID); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to end Twilio room: %v", err))
		// Continue with database update even if Twilio call fails
	}

	// Update session status
	now := time.Now()
	session.Status = models.CallStatusCompleted
	session.EndedAt = &now
	session.DurationSeconds = session.GetDurationSeconds()

	if err := s.videoCallRepo.UpdateVideoCallSession(session); err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	// Update participant left time
	participant, err := s.videoCallRepo.GetParticipantBySessionAndUser(sessionID, userID)
	if err == nil {
		participant.LeftAt = &now
		s.videoCallRepo.UpdateVideoCallParticipant(participant)
	}

	// Create audit log
	s.createAuditLog(sessionID, userID, "call_ended", fmt.Sprintf("Video call ended, duration: %d seconds", session.DurationSeconds), ipAddress, userAgent)

	return nil
}

// GetVideoCallsByAppointment retrieves all video call sessions for an appointment
func (s *VideoCallService) GetVideoCallsByAppointment(appointmentID uint, userID uint) ([]models.VideoCallResponse, error) {
	// Verify user has access to appointment
	appointment, err := s.appointmentRepo.GetAppointmentByID(appointmentID)
	if err != nil {
		return nil, fmt.Errorf("appointment not found: %w", err)
	}

	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return nil, fmt.Errorf("access denied")
	}

	// Get video call sessions
	sessions, err := s.videoCallRepo.GetVideoCallSessionsByAppointmentID(appointmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve video call sessions: %w", err)
	}

	var responses []models.VideoCallResponse
	for _, session := range sessions {
		responses = append(responses, session.ToResponse())
	}

	return responses, nil
}

// ProcessTwilioWebhook processes incoming Twilio webhooks
func (s *VideoCallService) ProcessTwilioWebhook(body []byte, signature string, url string) error {
	// Validate webhook signature
	if !s.twiLioService.ValidateWebhook(body, signature, url) {
		return fmt.Errorf("invalid webhook signature")
	}

	// Parse webhook event
	event, err := s.twiLioService.ParseWebhookEvent(body)
	if err != nil {
		return fmt.Errorf("failed to parse webhook event: %w", err)
	}

	// Process based on event type
	eventType, ok := event["StatusCallbackEvent"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid event type")
	}

	switch eventType {
	case "room-created":
		return s.handleRoomCreated(event)
	case "room-ended":
		return s.handleRoomEnded(event)
	case "participant-connected":
		return s.handleParticipantConnected(event)
	case "participant-disconnected":
		return s.handleParticipantDisconnected(event)
	case "recording-started":
		return s.handleRecordingStarted(event)
	case "recording-completed":
		return s.handleRecordingCompleted(event)
	default:
		s.logger.Info(fmt.Sprintf("Unhandled webhook event type: %s", eventType))
	}

	return nil
}

// Helper methods

func (s *VideoCallService) createParticipants(sessionID, doctorID, patientID uint) error {
	participants := []*models.VideoCallParticipant{
		{
			VideoCallSessionID: sessionID,
			UserID:             doctorID,
		},
		{
			VideoCallSessionID: sessionID,
			UserID:             patientID,
		},
	}

	for _, participant := range participants {
		if err := s.videoCallRepo.CreateVideoCallParticipant(participant); err != nil {
			return err
		}
	}

	return nil
}

func (s *VideoCallService) createAuditLog(sessionID, userID uint, action, details, ipAddress, userAgent string) {
	auditLog := &models.VideoCallAuditLog{
		VideoCallSessionID: sessionID,
		UserID:             &userID,
		Action:             action,
		Details:            details,
		IPAddress:          ipAddress,
		UserAgent:          userAgent,
	}

	if err := s.videoCallRepo.CreateVideoCallAuditLog(auditLog); err != nil {
		s.logger.Error("Failed to create video call audit log: " + err.Error())
	}
}

// Webhook event handlers

func (s *VideoCallService) handleRoomCreated(event map[string]interface{}) error {
	roomSID, ok := event["RoomSid"].(string)
	if !ok {
		return fmt.Errorf("missing RoomSid in event")
	}

	s.logger.Info(fmt.Sprintf("Room created webhook received for room: %s", roomSID))
	return nil
}

func (s *VideoCallService) handleRoomEnded(event map[string]interface{}) error {
	roomSID, ok := event["RoomSid"].(string)
	if !ok {
		return fmt.Errorf("missing RoomSid in event")
	}

	// Find and update session
	session, err := s.videoCallRepo.GetVideoCallSessionByRoomSID(roomSID)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to find session for room %s: %v", roomSID, err))
		return nil // Don't fail webhook processing
	}

	now := time.Now()
	session.Status = models.CallStatusCompleted
	session.EndedAt = &now
	session.DurationSeconds = session.GetDurationSeconds()

	if err := s.videoCallRepo.UpdateVideoCallSession(session); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to update session %d: %v", session.ID, err))
	}

	s.logger.Info(fmt.Sprintf("Room ended webhook processed for room: %s", roomSID))
	return nil
}

func (s *VideoCallService) handleParticipantConnected(event map[string]interface{}) error {
	roomSID, _ := event["RoomSid"].(string)
	participantSID, _ := event["ParticipantSid"].(string)
	identity, _ := event["ParticipantIdentity"].(string)

	s.logger.Info(fmt.Sprintf("Participant connected: %s (identity: %s) in room: %s", participantSID, identity, roomSID))
	return nil
}

func (s *VideoCallService) handleParticipantDisconnected(event map[string]interface{}) error {
	roomSID, _ := event["RoomSid"].(string)
	participantSID, _ := event["ParticipantSid"].(string)
	identity, _ := event["ParticipantIdentity"].(string)

	s.logger.Info(fmt.Sprintf("Participant disconnected: %s (identity: %s) from room: %s", participantSID, identity, roomSID))
	return nil
}

func (s *VideoCallService) handleRecordingStarted(event map[string]interface{}) error {
	roomSID, _ := event["RoomSid"].(string)
	recordingSID, _ := event["RecordingSid"].(string)

	// Update session with recording SID
	session, err := s.videoCallRepo.GetVideoCallSessionByRoomSID(roomSID)
	if err == nil {
		session.RecordingSID = recordingSID
		s.videoCallRepo.UpdateVideoCallSession(session)
	}

	s.logger.Info(fmt.Sprintf("Recording started: %s for room: %s", recordingSID, roomSID))
	return nil
}

func (s *VideoCallService) handleRecordingCompleted(event map[string]interface{}) error {
	roomSID, _ := event["RoomSid"].(string)
	recordingSID, _ := event["RecordingSid"].(string)

	s.logger.Info(fmt.Sprintf("Recording completed: %s for room: %s", recordingSID, roomSID))
	return nil
}

