package services

import (
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/logger"
)

type AppointmentService struct {
	appointmentRepo *repository.AppointmentRepository
	userRepo        *repository.UserRepository
	logger          *logger.Logger
}

func NewAppointmentService(appointmentRepo *repository.AppointmentRepository, userRepo *repository.UserRepository, logger *logger.Logger) *AppointmentService {
	return &AppointmentService{
		appointmentRepo: appointmentRepo,
		userRepo:        userRepo,
		logger:          logger,
	}
}

// Doctor Availability Management

func (s *AppointmentService) SetDoctorAvailability(doctorID uint, req *models.DoctorAvailabilityRequest, ipAddress string) error {
	availability := &models.DoctorAvailability{
		DoctorID:      doctorID,
		DayOfWeek:     req.DayOfWeek,
		StartTime:     req.StartTime,
		EndTime:       req.EndTime,
		SlotDuration:  req.SlotDuration,
		EffectiveFrom: req.EffectiveFrom,
		EffectiveTo:   req.EffectiveTo,
		IsActive:      true,
	}

	if err := s.appointmentRepo.CreateDoctorAvailability(availability); err != nil {
		return fmt.Errorf("failed to create availability: %w", err)
	}

	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "doctor_availability_set",
		UserID:    doctorID,
		UserRole:  "doctor",
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Doctor availability set for %s", req.DayOfWeek),
	})

	return nil
}

func (s *AppointmentService) GetDoctorAvailability(doctorID uint) ([]models.DoctorAvailability, error) {
	return s.appointmentRepo.GetDoctorWeeklyAvailability(doctorID)
}

func (s *AppointmentService) GetAvailableSlots(doctorID uint, date time.Time) ([]models.AvailableSlot, error) {
	// Get doctor's availability for the day
	dayOfWeek := models.DayOfWeek(date.Weekday().String())
	availabilities, err := s.appointmentRepo.GetDoctorAvailability(doctorID, dayOfWeek)
	if err != nil {
		return nil, err
	}

	// Get existing appointments
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)
	appointments, err := s.appointmentRepo.GetDoctorAppointments(doctorID, startOfDay, endOfDay)
	if err != nil {
		return nil, err
	}

	// Calculate available slots
	var slots []models.AvailableSlot
	for _, availability := range availabilities {
		slots = append(slots, s.calculateSlots(availability, date, appointments)...)
	}

	return slots, nil
}

// Patient Booking

func (s *AppointmentService) BookAppointment(patientID uint, req *models.BookAppointmentRequest, ipAddress string) (*models.AppointmentResponse, error) {
	// Check for conflicts
	conflict, err := s.appointmentRepo.CheckAppointmentConflict(req.DoctorID, req.ScheduledAt, req.Duration, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check conflicts: %w", err)
	}
	if conflict {
		return nil, fmt.Errorf("time slot is not available")
	}

	// Create appointment
	appointment := &models.Appointment{
		PatientID:       patientID,
		DoctorID:        req.DoctorID,
		AppointmentType: req.AppointmentType,
		Status:          models.AppointmentScheduled,
		ScheduledAt:     req.ScheduledAt,
		Duration:        req.Duration,
		Notes:           req.Notes,
	}

	if err := s.appointmentRepo.CreateAppointment(appointment); err != nil {
		return nil, fmt.Errorf("failed to create appointment: %w", err)
	}

	// Load full appointment data
	fullAppointment, err := s.appointmentRepo.GetAppointmentByID(appointment.ID)
	if err != nil {
		return nil, err
	}

	// Create audit log
	s.createAppointmentAuditLog(appointment.ID, patientID, "appointment_booked", "", appointment, ipAddress)

	// Log security event
	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:     "appointment_booked",
		UserID:    patientID,
		UserRole:  "patient",
		IPAddress: ipAddress,
		Message:   fmt.Sprintf("Appointment booked for %s", req.ScheduledAt.Format("2006-01-02 15:04")),
	})

	response := fullAppointment.ToResponse()
	return &response, nil
}

// Appointment Management

func (s *AppointmentService) GetAppointment(appointmentID uint, userID uint) (*models.AppointmentResponse, error) {
	appointment, err := s.appointmentRepo.GetAppointmentByID(appointmentID)
	if err != nil {
		return nil, err
	}

	// Check access permissions
	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return nil, fmt.Errorf("access denied")
	}

	response := appointment.ToResponse()
	return &response, nil
}

func (s *AppointmentService) RescheduleAppointment(appointmentID uint, userID uint, req *models.RescheduleAppointmentRequest, ipAddress string) (*models.AppointmentResponse, error) {
	// Get current appointment
	currentAppointment, err := s.appointmentRepo.GetAppointmentByID(appointmentID)
	if err != nil {
		return nil, err
	}

	// Check permissions
	if currentAppointment.PatientID != userID && currentAppointment.DoctorID != userID {
		return nil, fmt.Errorf("access denied")
	}

	// Check for conflicts
	conflict, err := s.appointmentRepo.CheckAppointmentConflict(currentAppointment.DoctorID, req.NewScheduledAt, currentAppointment.Duration, &appointmentID)
	if err != nil {
		return nil, err
	}
	if conflict {
		return nil, fmt.Errorf("new time slot is not available")
	}

	// Create audit log for old state
	oldValue, _ := json.Marshal(currentAppointment)

	// Update appointment
	currentAppointment.ScheduledAt = req.NewScheduledAt
	currentAppointment.Status = models.AppointmentScheduled // Reset to scheduled

	if err := s.appointmentRepo.UpdateAppointment(currentAppointment); err != nil {
		return nil, err
	}

	// Create audit log
	newValue, _ := json.Marshal(currentAppointment)
	s.createAppointmentAuditLogWithValues(appointmentID, userID, "appointment_rescheduled", req.Reason, string(oldValue), string(newValue), ipAddress)

	response := currentAppointment.ToResponse()
	return &response, nil
}

func (s *AppointmentService) CancelAppointment(appointmentID uint, userID uint, req *models.CancelAppointmentRequest, ipAddress string) error {
	appointment, err := s.appointmentRepo.GetAppointmentByID(appointmentID)
	if err != nil {
		return err
	}

	// Check permissions
	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return fmt.Errorf("access denied")
	}

	// Update status
	if err := s.appointmentRepo.UpdateAppointmentStatus(appointmentID, models.AppointmentCanceled, userID, req.Reason); err != nil {
		return err
	}

	// Create audit log
	s.createAppointmentAuditLog(appointmentID, userID, "appointment_canceled", req.Reason, appointment, ipAddress)

	return nil
}

// Helper methods

func (s *AppointmentService) calculateSlots(availability models.DoctorAvailability, date time.Time, appointments []models.Appointment) []models.AvailableSlot {
	var slots []models.AvailableSlot
	
	// Parse start and end times
	startTime, _ := time.Parse("15:04", availability.StartTime)
	endTime, _ := time.Parse("15:04", availability.EndTime)
	
	// Create datetime objects for the specific date
	start := time.Date(date.Year(), date.Month(), date.Day(), startTime.Hour(), startTime.Minute(), 0, 0, date.Location())
	end := time.Date(date.Year(), date.Month(), date.Day(), endTime.Hour(), endTime.Minute(), 0, 0, date.Location())
	
	// Generate slots
	slotDuration := time.Duration(availability.SlotDuration) * time.Minute
	for current := start; current.Add(slotDuration).Before(end) || current.Add(slotDuration).Equal(end); current = current.Add(slotDuration) {
		slotEnd := current.Add(slotDuration)
		
		// Check if slot conflicts with existing appointments
		if !s.hasConflict(current, slotEnd, appointments) {
			slots = append(slots, models.AvailableSlot{
				StartTime: current,
				EndTime:   slotEnd,
				Duration:  availability.SlotDuration,
				DoctorID:  availability.DoctorID,
			})
		}
	}
	
	return slots
}

func (s *AppointmentService) hasConflict(slotStart, slotEnd time.Time, appointments []models.Appointment) bool {
	for _, appointment := range appointments {
		appStart := appointment.ScheduledAt
		appEnd := appointment.ScheduledAt.Add(time.Duration(appointment.Duration) * time.Minute)
		
		// Check for overlap
		if (slotStart.Before(appEnd) && slotEnd.After(appStart)) {
			return true
		}
	}
	return false
}

func (s *AppointmentService) createAppointmentAuditLog(appointmentID, userID uint, action, reason string, appointment *models.Appointment, ipAddress string) {
	newValue, _ := json.Marshal(appointment)
	s.createAppointmentAuditLogWithValues(appointmentID, userID, action, reason, "", string(newValue), ipAddress)
}

func (s *AppointmentService) createAppointmentAuditLogWithValues(appointmentID, userID uint, action, reason, oldValue, newValue, ipAddress string) {
	auditLog := &models.AppointmentAuditLog{
		AppointmentID: appointmentID,
		UserID:        userID,
		Action:        action,
		OldValue:      oldValue,
		NewValue:      newValue,
		Reason:        reason,
		IPAddress:     ipAddress,
	}
	
	if err := s.appointmentRepo.CreateAppointmentAuditLog(auditLog); err != nil {
		s.logger.Error("Failed to create appointment audit log: " + err.Error())
	}
}

