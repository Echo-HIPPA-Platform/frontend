package repository

import (
	"fmt"
	"time"

	"backend/internal/models"
	"gorm.io/gorm"
)

type AppointmentRepository struct {
	db *gorm.DB
}

func NewAppointmentRepository(db *gorm.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

// Doctor Availability Methods

// CreateDoctorAvailability creates a new availability schedule
func (r *AppointmentRepository) CreateDoctorAvailability(availability *models.DoctorAvailability) error {
	return r.db.Create(availability).Error
}

// GetDoctorAvailability gets doctor's availability for a specific day
func (r *AppointmentRepository) GetDoctorAvailability(doctorID uint, dayOfWeek models.DayOfWeek) ([]models.DoctorAvailability, error) {
	var availabilities []models.DoctorAvailability
	now := time.Now()
	
	err := r.db.Where("doctor_id = ? AND day_of_week = ? AND is_active = ? AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)",
		doctorID, dayOfWeek, true, now, now).
		Preload("Doctor").
		Find(&availabilities).Error
	
	return availabilities, err
}

// GetDoctorAvailabilityByID gets availability by ID
func (r *AppointmentRepository) GetDoctorAvailabilityByID(id uint) (*models.DoctorAvailability, error) {
	var availability models.DoctorAvailability
	err := r.db.Preload("Doctor").First(&availability, id).Error
	if err != nil {
		return nil, err
	}
	return &availability, nil
}

// UpdateDoctorAvailability updates availability
func (r *AppointmentRepository) UpdateDoctorAvailability(availability *models.DoctorAvailability) error {
	return r.db.Save(availability).Error
}

// DeleteDoctorAvailability soft deletes availability
func (r *AppointmentRepository) DeleteDoctorAvailability(id uint) error {
	return r.db.Model(&models.DoctorAvailability{}).Where("id = ?", id).Update("is_active", false).Error
}

// GetDoctorWeeklyAvailability gets all availability for a doctor for the week
func (r *AppointmentRepository) GetDoctorWeeklyAvailability(doctorID uint) ([]models.DoctorAvailability, error) {
	var availabilities []models.DoctorAvailability
	now := time.Now()
	
	err := r.db.Where("doctor_id = ? AND is_active = ? AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)",
		doctorID, true, now, now).
		Preload("Doctor").
		Order("day_of_week, start_time").
		Find(&availabilities).Error
	
	return availabilities, err
}

// Doctor Break Methods

// CreateDoctorBreak creates a new break
func (r *AppointmentRepository) CreateDoctorBreak(break_ *models.DoctorBreak) error {
	return r.db.Create(break_).Error
}

// GetDoctorBreaks gets breaks for an availability
func (r *AppointmentRepository) GetDoctorBreaks(availabilityID uint) ([]models.DoctorBreak, error) {
	var breaks []models.DoctorBreak
	err := r.db.Where("availability_id = ?", availabilityID).
		Preload("Availability").
		Find(&breaks).Error
	return breaks, err
}

// UpdateDoctorBreak updates a break
func (r *AppointmentRepository) UpdateDoctorBreak(break_ *models.DoctorBreak) error {
	return r.db.Save(break_).Error
}

// DeleteDoctorBreak deletes a break
func (r *AppointmentRepository) DeleteDoctorBreak(id uint) error {
	return r.db.Delete(&models.DoctorBreak{}, id).Error
}

// Doctor Exception Methods

// CreateDoctorException creates a new exception
func (r *AppointmentRepository) CreateDoctorException(exception *models.DoctorException) error {
	return r.db.Create(exception).Error
}

// GetDoctorExceptions gets exceptions for a doctor in a date range
func (r *AppointmentRepository) GetDoctorExceptions(doctorID uint, startDate, endDate time.Time) ([]models.DoctorException, error) {
	var exceptions []models.DoctorException
	err := r.db.Where("doctor_id = ? AND date >= ? AND date <= ?", doctorID, startDate, endDate).
		Preload("Doctor").
		Order("date").
		Find(&exceptions).Error
	return exceptions, err
}

// GetDoctorExceptionByDate gets exception for a specific date
func (r *AppointmentRepository) GetDoctorExceptionByDate(doctorID uint, date time.Time) (*models.DoctorException, error) {
	var exception models.DoctorException
	err := r.db.Where("doctor_id = ? AND date = ?", doctorID, date.Format("2006-01-02")).
		First(&exception).Error
	if err != nil {
		return nil, err
	}
	return &exception, nil
}

// UpdateDoctorException updates an exception
func (r *AppointmentRepository) UpdateDoctorException(exception *models.DoctorException) error {
	return r.db.Save(exception).Error
}

// DeleteDoctorException deletes an exception
func (r *AppointmentRepository) DeleteDoctorException(id uint) error {
	return r.db.Delete(&models.DoctorException{}, id).Error
}

// Appointment Methods

// CreateAppointment creates a new appointment
func (r *AppointmentRepository) CreateAppointment(appointment *models.Appointment) error {
	return r.db.Create(appointment).Error
}

// GetAppointmentByID gets appointment by ID
func (r *AppointmentRepository) GetAppointmentByID(id uint) (*models.Appointment, error) {
	var appointment models.Appointment
	err := r.db.Preload("Patient").Preload("Patient.Profile").
		Preload("Doctor").Preload("Doctor.Profile").
		Preload("CanceledByUser").Preload("CanceledByUser.Profile").
		Preload("OriginalAppointment").
		First(&appointment, id).Error
	if err != nil {
		return nil, err
	}
	return &appointment, nil
}

// GetAppointments gets appointments with filtering and pagination
func (r *AppointmentRepository) GetAppointments(patientID, doctorID *uint, status models.AppointmentStatus, startDate, endDate *time.Time, page, pageSize int) ([]models.Appointment, int64, error) {
	var appointments []models.Appointment
	var total int64

	query := r.db.Preload("Patient").Preload("Patient.Profile").
		Preload("Doctor").Preload("Doctor.Profile").
		Preload("CanceledByUser").Preload("CanceledByUser.Profile")

	// Apply filters
	if patientID != nil {
		query = query.Where("patient_id = ?", *patientID)
	}
	if doctorID != nil {
		query = query.Where("doctor_id = ?", *doctorID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if startDate != nil {
		query = query.Where("scheduled_at >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("scheduled_at <= ?", *endDate)
	}

	// Get total count
	if err := query.Model(&models.Appointment{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count appointments: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("scheduled_at DESC").Find(&appointments).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get appointments: %w", err)
	}

	return appointments, total, nil
}

// GetDoctorAppointments gets appointments for a doctor in a date range
func (r *AppointmentRepository) GetDoctorAppointments(doctorID uint, startDate, endDate time.Time) ([]models.Appointment, error) {
	var appointments []models.Appointment
	err := r.db.Where("doctor_id = ? AND scheduled_at >= ? AND scheduled_at <= ? AND status NOT IN (?)",
		doctorID, startDate, endDate, []models.AppointmentStatus{models.AppointmentCanceled, models.AppointmentRescheduled}).
		Preload("Patient").Preload("Patient.Profile").
		Preload("Doctor").Preload("Doctor.Profile").
		Order("scheduled_at").
		Find(&appointments).Error
	return appointments, err
}

// GetPatientAppointments gets appointments for a patient
func (r *AppointmentRepository) GetPatientAppointments(patientID uint, startDate, endDate *time.Time) ([]models.Appointment, error) {
	var appointments []models.Appointment
	query := r.db.Where("patient_id = ?", patientID)
	
	if startDate != nil {
		query = query.Where("scheduled_at >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("scheduled_at <= ?", *endDate)
	}
	
	err := query.Preload("Patient").Preload("Patient.Profile").
		Preload("Doctor").Preload("Doctor.Profile").
		Preload("CanceledByUser").Preload("CanceledByUser.Profile").
		Order("scheduled_at").
		Find(&appointments).Error
	return appointments, err
}

// UpdateAppointment updates an appointment
func (r *AppointmentRepository) UpdateAppointment(appointment *models.Appointment) error {
	return r.db.Save(appointment).Error
}

// UpdateAppointmentStatus updates appointment status
func (r *AppointmentRepository) UpdateAppointmentStatus(appointmentID uint, status models.AppointmentStatus, userID uint, reason string) error {
	updates := map[string]interface{}{
		"status": status,
	}

	now := time.Now()
	switch status {
	case models.AppointmentCanceled:
		updates["canceled_by"] = userID
		updates["canceled_at"] = &now
		updates["cancel_reason"] = reason
	case models.AppointmentConfirmed:
		updates["confirmed_at"] = &now
	case models.AppointmentCompleted:
		updates["completed_at"] = &now
	}

	return r.db.Model(&models.Appointment{}).Where("id = ?", appointmentID).Updates(updates).Error
}

// CheckAppointmentConflict checks if there's a scheduling conflict
func (r *AppointmentRepository) CheckAppointmentConflict(doctorID uint, scheduledAt time.Time, duration int, excludeAppointmentID *uint) (bool, error) {
	var count int64
	endTime := scheduledAt.Add(time.Duration(duration) * time.Minute)

	query := r.db.Model(&models.Appointment{}).
		Where("doctor_id = ? AND status NOT IN (?) AND ((scheduled_at <= ? AND DATE_ADD(scheduled_at, INTERVAL duration MINUTE) > ?) OR (scheduled_at < ? AND DATE_ADD(scheduled_at, INTERVAL duration MINUTE) >= ?))",
			doctorID, 
			[]models.AppointmentStatus{models.AppointmentCanceled, models.AppointmentRescheduled},
			scheduledAt, scheduledAt,
			endTime, endTime)

	// Exclude current appointment if updating
	if excludeAppointmentID != nil {
		query = query.Where("id != ?", *excludeAppointmentID)
	}

	err := query.Count(&count).Error
	return count > 0, err
}

// Appointment Audit Methods

// CreateAppointmentAuditLog creates an audit log entry
func (r *AppointmentRepository) CreateAppointmentAuditLog(log *models.AppointmentAuditLog) error {
	return r.db.Create(log).Error
}

// GetAppointmentAuditLogs gets audit logs for an appointment
func (r *AppointmentRepository) GetAppointmentAuditLogs(appointmentID uint) ([]models.AppointmentAuditLog, error) {
	var logs []models.AppointmentAuditLog
	err := r.db.Where("appointment_id = ?", appointmentID).
		Preload("User").Preload("User.Profile").
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

// Notification Template Methods

// GetNotificationTemplate gets template by name
func (r *AppointmentRepository) GetNotificationTemplate(name string) (*models.NotificationTemplate, error) {
	var template models.NotificationTemplate
	err := r.db.Where("name = ? AND is_active = ?", name, true).First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

// CreateNotificationTemplate creates a new template
func (r *AppointmentRepository) CreateNotificationTemplate(template *models.NotificationTemplate) error {
	return r.db.Create(template).Error
}

// UpdateNotificationTemplate updates a template
func (r *AppointmentRepository) UpdateNotificationTemplate(template *models.NotificationTemplate) error {
	return r.db.Save(template).Error
}

// Notification Log Methods

// CreateNotificationLog creates a notification log entry
func (r *AppointmentRepository) CreateNotificationLog(log *models.NotificationLog) error {
	return r.db.Create(log).Error
}

// UpdateNotificationLogStatus updates notification status
func (r *AppointmentRepository) UpdateNotificationLogStatus(id uint, status string, messageID, failureReason string) error {
	updates := map[string]interface{}{
		"status": status,
	}

	now := time.Now()
	switch status {
	case "sent":
		updates["sent_at"] = &now
		updates["provider_message_id"] = messageID
	case "delivered":
		updates["delivered_at"] = &now
	case "failed":
		updates["failed_at"] = &now
		updates["failure_reason"] = failureReason
	}

	return r.db.Model(&models.NotificationLog{}).Where("id = ?", id).Updates(updates).Error
}

// GetNotificationLogs gets notification logs for an appointment
func (r *AppointmentRepository) GetNotificationLogs(appointmentID uint) ([]models.NotificationLog, error) {
	var logs []models.NotificationLog
	err := r.db.Where("appointment_id = ?", appointmentID).
		Preload("Recipient").Preload("Recipient.Profile").
		Preload("Template").
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

// Utility Methods

// GetAvailableDoctors gets doctors available for a specific time slot
func (r *AppointmentRepository) GetAvailableDoctors(scheduledAt time.Time, duration int) ([]models.User, error) {
	var doctors []models.User
	
	// This is a complex query that would need to check:
	// 1. Doctor availability for the day of week
	// 2. No conflicting appointments
	// 3. No exceptions for that date
	// 4. Account for breaks
	
	// For now, return verified doctors - this would need more complex logic
	err := r.db.Joins("JOIN doctor_profiles ON users.id = doctor_profiles.user_id").
		Where("users.role = ? AND users.is_active = ? AND doctor_profiles.verification_status = ?",
			models.RoleDoctor, true, models.VerificationApproved).
		Preload("Profile").
		Find(&doctors).Error
	
	return doctors, err
}

// GetUpcomingAppointments gets appointments that need reminders
func (r *AppointmentRepository) GetUpcomingAppointments(reminderHours int) ([]models.Appointment, error) {
	var appointments []models.Appointment
	
	reminderTime := time.Now().Add(time.Duration(reminderHours) * time.Hour)
	oneHourFromNow := time.Now().Add(time.Hour)
	
	err := r.db.Where("scheduled_at >= ? AND scheduled_at <= ? AND status = ? AND reminder_sent_at IS NULL",
		oneHourFromNow, reminderTime, models.AppointmentScheduled).
		Preload("Patient").Preload("Patient.Profile").
		Preload("Doctor").Preload("Doctor.Profile").
		Find(&appointments).Error
	
	return appointments, err
}

// MarkReminderSent marks that a reminder was sent
func (r *AppointmentRepository) MarkReminderSent(appointmentID uint) error {
	now := time.Now()
	return r.db.Model(&models.Appointment{}).Where("id = ?", appointmentID).Update("reminder_sent_at", &now).Error
}

