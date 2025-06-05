package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// AppointmentStatus defines the status of an appointment
type AppointmentStatus string

const (
	AppointmentScheduled  AppointmentStatus = "scheduled"
	AppointmentConfirmed  AppointmentStatus = "confirmed"
	AppointmentInProgress AppointmentStatus = "in_progress"
	AppointmentCompleted  AppointmentStatus = "completed"
	AppointmentCanceled   AppointmentStatus = "canceled"
	AppointmentNoShow     AppointmentStatus = "no_show"
	AppointmentRescheduled AppointmentStatus = "rescheduled"
)

// AppointmentType defines the type of appointment
type AppointmentType string

const (
	AppointmentInitialConsultation AppointmentType = "initial_consultation"
	AppointmentFollowUp            AppointmentType = "follow_up"
	AppointmentTherapySession      AppointmentType = "therapy_session"
	AppointmentMedicationReview    AppointmentType = "medication_review"
	AppointmentEmergencySession    AppointmentType = "emergency_session"
)

// DayOfWeek represents days of the week
type DayOfWeek string

const (
	Monday    DayOfWeek = "monday"
	Tuesday   DayOfWeek = "tuesday"
	Wednesday DayOfWeek = "wednesday"
	Thursday  DayOfWeek = "thursday"
	Friday    DayOfWeek = "friday"
	Saturday  DayOfWeek = "saturday"
	Sunday    DayOfWeek = "sunday"
)

// DoctorAvailability represents doctor's regular availability schedule
type DoctorAvailability struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	DoctorID        uint      `json:"doctor_id" gorm:"not null;index"`
	DayOfWeek       DayOfWeek `json:"day_of_week" gorm:"not null"`
	StartTime       string    `json:"start_time" gorm:"not null"` // Format: "09:00"
	EndTime         string    `json:"end_time" gorm:"not null"`   // Format: "17:00"
	SlotDuration    int       `json:"slot_duration" gorm:"not null;default:60"` // Minutes
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	EffectiveFrom   time.Time `json:"effective_from"`
	EffectiveTo     *time.Time `json:"effective_to,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relationships
	Doctor User `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
}

// DoctorBreak represents breaks in doctor's schedule
type DoctorBreak struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	AvailabilityID   uint      `json:"availability_id" gorm:"not null;index"`
	StartTime        string    `json:"start_time" gorm:"not null"` // Format: "12:00"
	EndTime          string    `json:"end_time" gorm:"not null"`   // Format: "13:00"
	BreakType        string    `json:"break_type" gorm:"not null;default:lunch"` // lunch, meeting, personal
	Recurring        bool      `json:"recurring" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relationships
	Availability DoctorAvailability `json:"availability,omitempty" gorm:"foreignKey:AvailabilityID"`
}

// DoctorException represents exceptions to regular availability (holidays, time off)
type DoctorException struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	DoctorID    uint       `json:"doctor_id" gorm:"not null;index"`
	Date        time.Time  `json:"date" gorm:"type:date;not null"`
	IsAvailable bool       `json:"is_available" gorm:"default:false"` // false = unavailable, true = special availability
	StartTime   *string    `json:"start_time,omitempty"`              // For special availability
	EndTime     *string    `json:"end_time,omitempty"`                // For special availability
	Reason      string     `json:"reason,omitempty"`                   // Holiday, vacation, conference, etc.
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relationships
	Doctor User `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
}

// Appointment represents a scheduled appointment between patient and doctor
type Appointment struct {
	ID                uint              `json:"id" gorm:"primaryKey"`
	PatientID         uint              `json:"patient_id" gorm:"not null;index"`
	DoctorID          uint              `json:"doctor_id" gorm:"not null;index"`
	AppointmentType   AppointmentType   `json:"appointment_type" gorm:"not null"`
	Status            AppointmentStatus `json:"status" gorm:"not null;default:scheduled"`
	ScheduledAt       time.Time         `json:"scheduled_at" gorm:"not null;index"`
	Duration          int               `json:"duration" gorm:"not null;default:60"` // Minutes
	Notes             string            `json:"notes,omitempty"`                     // Patient notes for the appointment
	DoctorNotes       string            `json:"doctor_notes,omitempty"`              // Doctor's notes (PHI)
	CancelReason      string            `json:"cancel_reason,omitempty"`
	CanceledBy        *uint             `json:"canceled_by,omitempty"` // User ID who canceled
	CanceledAt        *time.Time        `json:"canceled_at,omitempty"`
	ConfirmedAt       *time.Time        `json:"confirmed_at,omitempty"`
	CompletedAt       *time.Time        `json:"completed_at,omitempty"`
	ReminderSentAt    *time.Time        `json:"reminder_sent_at,omitempty"`
	OriginalAppointmentID *uint         `json:"original_appointment_id,omitempty"` // For rescheduled appointments
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
	DeletedAt         gorm.DeletedAt    `json:"-" gorm:"index"` // Soft delete for HIPAA compliance

	// Relationships
	Patient            User         `json:"patient,omitempty" gorm:"foreignKey:PatientID"`
	Doctor             User         `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	CanceledByUser     *User        `json:"canceled_by_user,omitempty" gorm:"foreignKey:CanceledBy"`
	OriginalAppointment *Appointment `json:"original_appointment,omitempty" gorm:"foreignKey:OriginalAppointmentID"`
	RescheduledAppointments []Appointment `json:"rescheduled_appointments,omitempty" gorm:"foreignKey:OriginalAppointmentID"`
}

// AppointmentAuditLog tracks changes to appointments for HIPAA compliance
type AppointmentAuditLog struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	AppointmentID uint      `json:"appointment_id" gorm:"not null;index"`
	UserID        uint      `json:"user_id" gorm:"not null;index"` // Who made the change
	Action        string    `json:"action" gorm:"not null"`        // created, updated, canceled, completed, etc.
	OldValue      string    `json:"old_value,omitempty"`           // JSON of previous state
	NewValue      string    `json:"new_value,omitempty"`           // JSON of new state
	Reason        string    `json:"reason,omitempty"`              // Reason for change
	IPAddress     string    `json:"ip_address"`
	UserAgent     string    `json:"user_agent"`
	CreatedAt     time.Time `json:"created_at"`

	// Relationships
	Appointment Appointment `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
	User        User        `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// NotificationTemplate represents email templates for appointment notifications
type NotificationTemplate struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Name            string    `json:"name" gorm:"uniqueIndex;not null"` // appointment_confirmation, reminder, cancellation
	Subject         string    `json:"subject" gorm:"not null"`
	BodyText        string    `json:"body_text" gorm:"type:text"`       // Plain text version
	BodyHTML        string    `json:"body_html" gorm:"type:text"`       // HTML version
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// NotificationLog tracks sent notifications for HIPAA compliance and delivery confirmation
type NotificationLog struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	AppointmentID uint      `json:"appointment_id" gorm:"not null;index"`
	RecipientID   uint      `json:"recipient_id" gorm:"not null;index"` // Patient or Doctor ID
	TemplateID    uint      `json:"template_id" gorm:"not null;index"`
	NotificationType string `json:"notification_type" gorm:"not null"` // email, sms (future)
	RecipientEmail string   `json:"recipient_email" gorm:"not null"`
	Subject       string    `json:"subject" gorm:"not null"`
	Status        string    `json:"status" gorm:"not null;default:pending"` // pending, sent, delivered, failed
	ProviderMessageID string `json:"provider_message_id,omitempty"`       // SES Message ID
	SentAt        *time.Time `json:"sent_at,omitempty"`
	DeliveredAt   *time.Time `json:"delivered_at,omitempty"`
	FailedAt      *time.Time `json:"failed_at,omitempty"`
	FailureReason string    `json:"failure_reason,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	Appointment Appointment         `json:"appointment,omitempty" gorm:"foreignKey:AppointmentID"`
	Recipient   User                `json:"recipient,omitempty" gorm:"foreignKey:RecipientID"`
	Template    NotificationTemplate `json:"template,omitempty" gorm:"foreignKey:TemplateID"`
}

// DTOs for API requests and responses

// DoctorAvailabilityRequest for setting availability
type DoctorAvailabilityRequest struct {
	DayOfWeek     DayOfWeek `json:"day_of_week" validate:"required,oneof=monday tuesday wednesday thursday friday saturday sunday"`
	StartTime     string    `json:"start_time" validate:"required,time_format=15:04"`
	EndTime       string    `json:"end_time" validate:"required,time_format=15:04"`
	SlotDuration  int       `json:"slot_duration" validate:"required,min=15,max=240"` // 15 minutes to 4 hours
	EffectiveFrom time.Time `json:"effective_from" validate:"required"`
	EffectiveTo   *time.Time `json:"effective_to,omitempty"`
}

// DoctorBreakRequest for setting breaks
type DoctorBreakRequest struct {
	AvailabilityID uint   `json:"availability_id" validate:"required"`
	StartTime      string `json:"start_time" validate:"required,time_format=15:04"`
	EndTime        string `json:"end_time" validate:"required,time_format=15:04"`
	BreakType      string `json:"break_type" validate:"required,oneof=lunch meeting personal"`
	Recurring      bool   `json:"recurring"`
}

// DoctorExceptionRequest for setting exceptions
type DoctorExceptionRequest struct {
	Date        time.Time `json:"date" validate:"required"`
	IsAvailable bool      `json:"is_available"`
	StartTime   *string   `json:"start_time,omitempty" validate:"omitempty,time_format=15:04"`
	EndTime     *string   `json:"end_time,omitempty" validate:"omitempty,time_format=15:04"`
	Reason      string    `json:"reason,omitempty" validate:"max=255"`
}

// BookAppointmentRequest for patients to book appointments
type BookAppointmentRequest struct {
	DoctorID        uint            `json:"doctor_id" validate:"required"`
	AppointmentType AppointmentType `json:"appointment_type" validate:"required"`
	ScheduledAt     time.Time       `json:"scheduled_at" validate:"required"`
	Duration        int             `json:"duration" validate:"required,min=15,max=240"`
	Notes           string          `json:"notes,omitempty" validate:"max=1000"`
}

// RescheduleAppointmentRequest for rescheduling
type RescheduleAppointmentRequest struct {
	NewScheduledAt time.Time `json:"new_scheduled_at" validate:"required"`
	Reason         string    `json:"reason,omitempty" validate:"max=500"`
}

// CancelAppointmentRequest for canceling
type CancelAppointmentRequest struct {
	Reason string `json:"reason" validate:"required,max=500"`
}

// Validation methods

// Validate validates DoctorAvailabilityRequest
func (r *DoctorAvailabilityRequest) Validate() error {
	// Validate day of week
	validDays := map[DayOfWeek]bool{
		Monday: true, Tuesday: true, Wednesday: true, Thursday: true,
		Friday: true, Saturday: true, Sunday: true,
	}
	if !validDays[r.DayOfWeek] {
		return fmt.Errorf("invalid day of week")
	}

	// Validate time format
	if _, err := time.Parse("15:04", r.StartTime); err != nil {
		return fmt.Errorf("invalid start time format")
	}
	if _, err := time.Parse("15:04", r.EndTime); err != nil {
		return fmt.Errorf("invalid end time format")
	}

	// Validate slot duration
	if r.SlotDuration < 15 || r.SlotDuration > 240 {
		return fmt.Errorf("slot duration must be between 15 and 240 minutes")
	}

	return nil
}

// Validate validates BookAppointmentRequest
func (r *BookAppointmentRequest) Validate() error {
	if r.DoctorID == 0 {
		return fmt.Errorf("doctor_id is required")
	}
	if r.Duration < 15 || r.Duration > 240 {
		return fmt.Errorf("duration must be between 15 and 240 minutes")
	}
	return nil
}

// Validate validates RescheduleAppointmentRequest
func (r *RescheduleAppointmentRequest) Validate() error {
	if r.NewScheduledAt.IsZero() {
		return fmt.Errorf("new_scheduled_at is required")
	}
	if len(r.Reason) > 500 {
		return fmt.Errorf("reason cannot exceed 500 characters")
	}
	return nil
}

// Validate validates CancelAppointmentRequest
func (r *CancelAppointmentRequest) Validate() error {
	if r.Reason == "" {
		return fmt.Errorf("reason is required")
	}
	if len(r.Reason) > 500 {
		return fmt.Errorf("reason cannot exceed 500 characters")
	}
	return nil
}

// AvailableSlot represents an available time slot
type AvailableSlot struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Duration  int       `json:"duration"`
	DoctorID  uint      `json:"doctor_id"`
}

// AppointmentResponse for API responses
type AppointmentResponse struct {
	ID                    uint              `json:"id"`
	Patient               UserResponse      `json:"patient"`
	Doctor                UserResponse      `json:"doctor"`
	AppointmentType       AppointmentType   `json:"appointment_type"`
	Status                AppointmentStatus `json:"status"`
	ScheduledAt           time.Time         `json:"scheduled_at"`
	Duration              int               `json:"duration"`
	Notes                 string            `json:"notes,omitempty"`
	DoctorNotes           string            `json:"doctor_notes,omitempty"`
	CancelReason          string            `json:"cancel_reason,omitempty"`
	CanceledBy            *UserResponse     `json:"canceled_by,omitempty"`
	CanceledAt            *time.Time        `json:"canceled_at,omitempty"`
	ConfirmedAt           *time.Time        `json:"confirmed_at,omitempty"`
	CompletedAt           *time.Time        `json:"completed_at,omitempty"`
	OriginalAppointmentID *uint             `json:"original_appointment_id,omitempty"`
	CreatedAt             time.Time         `json:"created_at"`
	UpdatedAt             time.Time         `json:"updated_at"`
}

// Helper methods

func (as AppointmentStatus) IsValid() bool {
	return as == AppointmentScheduled || as == AppointmentConfirmed ||
		as == AppointmentInProgress || as == AppointmentCompleted ||
		as == AppointmentCanceled || as == AppointmentNoShow ||
		as == AppointmentRescheduled
}

func (as AppointmentStatus) String() string {
	return string(as)
}

func (at AppointmentType) IsValid() bool {
	return at == AppointmentInitialConsultation || at == AppointmentFollowUp ||
		at == AppointmentTherapySession || at == AppointmentMedicationReview ||
		at == AppointmentEmergencySession
}

func (at AppointmentType) String() string {
	return string(at)
}

func (dow DayOfWeek) IsValid() bool {
	return dow == Monday || dow == Tuesday || dow == Wednesday ||
		dow == Thursday || dow == Friday || dow == Saturday || dow == Sunday
}

func (dow DayOfWeek) String() string {
	return string(dow)
}

// ToResponse converts Appointment to AppointmentResponse
func (a *Appointment) ToResponse() AppointmentResponse {
	response := AppointmentResponse{
		ID:                    a.ID,
		Patient:               a.Patient.ToResponse(),
		Doctor:                a.Doctor.ToResponse(),
		AppointmentType:       a.AppointmentType,
		Status:                a.Status,
		ScheduledAt:           a.ScheduledAt,
		Duration:              a.Duration,
		Notes:                 a.Notes,
		DoctorNotes:           a.DoctorNotes,
		CancelReason:          a.CancelReason,
		CanceledAt:            a.CanceledAt,
		ConfirmedAt:           a.ConfirmedAt,
		CompletedAt:           a.CompletedAt,
		OriginalAppointmentID: a.OriginalAppointmentID,
		CreatedAt:             a.CreatedAt,
		UpdatedAt:             a.UpdatedAt,
	}

	if a.CanceledByUser != nil {
		canceledByResponse := a.CanceledByUser.ToResponse()
		response.CanceledBy = &canceledByResponse
	}

	return response
}

