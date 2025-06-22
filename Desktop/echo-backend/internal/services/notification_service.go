package services

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/logger"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
)

// NotificationService handles all notification-related operations including email notifications
type NotificationService struct {
	appointmentRepo  *repository.AppointmentRepository
	userRepo         *repository.UserRepository
	sesClient        *ses.SES
	logger           *logger.Logger
	fromEmail        string
	templates        map[string]*template.Template
}

type EmailData struct {
	PatientFirstName string
	AppointmentDate  string
	AppointmentTime  string
	DoctorFirstName  string
	AppointmentType  string
	Reason           string
}

func NewNotificationService(appointmentRepo *repository.AppointmentRepository, userRepo *repository.UserRepository, logger *logger.Logger, fromEmail string) (*NotificationService, error) {
	// Initialize AWS SES session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"), // SES primary region
	})
	if err != nil {
		logger.Error("Failed to create AWS session: " + err.Error())
		return nil, err
	}

	sesClient := ses.New(sess)

	service := &NotificationService{
		appointmentRepo:  appointmentRepo,
		userRepo:         userRepo,
		sesClient:        sesClient,
		logger:           logger,
		fromEmail:        fromEmail,
		templates:        make(map[string]*template.Template),
	}

	// Load email templates
	service.loadTemplates()

	return service, nil
}

func (s *NotificationService) loadTemplates() {
	// Appointment confirmation template
	confirmationTemplate := `
Dear {{.PatientFirstName}},

Your appointment has been confirmed:

Date: {{.AppointmentDate}}
Time: {{.AppointmentTime}}
Type: {{.AppointmentType}}
Doctor: Dr. {{.DoctorFirstName}}

Please arrive 15 minutes early for check-in.

Best regards,
Your Healthcare Team
`

	// Appointment reminder template
	reminderTemplate := `
Dear {{.PatientFirstName}},

This is a reminder of your upcoming appointment:

Date: {{.AppointmentDate}}
Time: {{.AppointmentTime}}
Type: {{.AppointmentType}}
Doctor: Dr. {{.DoctorFirstName}}

Please arrive 15 minutes early for check-in.

Best regards,
Your Healthcare Team
`

	// Appointment reschedule template
	rescheduleTemplate := `
Dear {{.PatientFirstName}},

Your appointment has been rescheduled:

New Date: {{.AppointmentDate}}
New Time: {{.AppointmentTime}}
Type: {{.AppointmentType}}
Doctor: Dr. {{.DoctorFirstName}}
{{if .Reason}}Reason: {{.Reason}}{{end}}

Please arrive 15 minutes early for check-in.

Best regards,
Your Healthcare Team
`

	// Appointment cancellation template
	cancellationTemplate := `
Dear {{.PatientFirstName}},

Your appointment has been canceled:

Date: {{.AppointmentDate}}
Time: {{.AppointmentTime}}
Type: {{.AppointmentType}}
Doctor: Dr. {{.DoctorFirstName}}
{{if .Reason}}Reason: {{.Reason}}{{end}}

To reschedule, please contact us or use our patient portal.

Best regards,
Your Healthcare Team
`

	// Parse templates
	s.templates["confirmation"] = template.Must(template.New("confirmation").Parse(confirmationTemplate))
	s.templates["reminder"] = template.Must(template.New("reminder").Parse(reminderTemplate))
	s.templates["reschedule"] = template.Must(template.New("reschedule").Parse(rescheduleTemplate))
	s.templates["cancellation"] = template.Must(template.New("cancellation").Parse(cancellationTemplate))
}

// Notification type constants
const (
	NotificationConfirmation = "confirmation"
	NotificationReminder     = "reminder"
	NotificationReschedule   = "reschedule"
	NotificationCancellation = "cancellation"
	NotificationPending      = "pending"
	NotificationSent         = "sent"
	NotificationFailed       = "failed"
)

// Send appointment confirmation
func (s *NotificationService) SendAppointmentConfirmation(appointmentID uint) error {
	return s.sendAppointmentNotification(appointmentID, NotificationConfirmation, "Appointment Confirmed")
}

// Send appointment reminder
func (s *NotificationService) SendAppointmentReminder(appointmentID uint) error {
	return s.sendAppointmentNotification(appointmentID, NotificationReminder, "Appointment Reminder")
}

// Send reschedule notification
func (s *NotificationService) SendRescheduleNotification(appointmentID uint, reason string) error {
	return s.sendAppointmentNotificationWithReason(appointmentID, NotificationReschedule, "Appointment Rescheduled", reason)
}

// Send cancellation notification
func (s *NotificationService) SendCancellationNotification(appointmentID uint, reason string) error {
	return s.sendAppointmentNotificationWithReason(appointmentID, NotificationCancellation, "Appointment Canceled", reason)
}

func (s *NotificationService) sendAppointmentNotification(appointmentID uint, notificationType string, subject string) error {
	return s.sendAppointmentNotificationWithReason(appointmentID, notificationType, subject, "")
}

func (s *NotificationService) sendAppointmentNotificationWithReason(appointmentID uint, notificationType string, subject string, reason string) error {
	// Get appointment details
	appointment, err := s.appointmentRepo.GetAppointmentByID(appointmentID)
	if err != nil {
		return fmt.Errorf("failed to get appointment: %w", err)
	}

	// Get patient and doctor details
	patient, err := s.userRepo.GetUserByID(appointment.PatientID)
	if err != nil {
		return fmt.Errorf("failed to get patient: %w", err)
	}

	doctor, err := s.userRepo.GetUserByID(appointment.DoctorID)
	if err != nil {
		return fmt.Errorf("failed to get doctor: %w", err)
	}

	// For now, we'll skip saving to database since there's no notification repository
	// In a full implementation, you would need to create the notification repository

	// Prepare email data (HIPAA-compliant)
	emailData := EmailData{
		PatientFirstName: patient.Profile.FirstName,
		AppointmentDate:  appointment.ScheduledAt.Format("January 2, 2006"),
		AppointmentTime:  appointment.ScheduledAt.Format("3:04 PM"),
		DoctorFirstName:  doctor.Profile.FirstName,
		AppointmentType:  string(appointment.AppointmentType),
		Reason:           reason,
	}

	// Generate email content
	var templateKey string
	switch notificationType {
	case NotificationConfirmation:
		templateKey = "confirmation"
	case NotificationReminder:
		templateKey = "reminder"
	case NotificationReschedule:
		templateKey = "reschedule"
	case NotificationCancellation:
		templateKey = "cancellation"
	default:
		return fmt.Errorf("unsupported notification type: %s", notificationType)
	}

	body, err := s.generateEmailBody(templateKey, emailData)
	if err != nil {
		return fmt.Errorf("failed to generate email body: %w", err)
	}

	// Send email
	if err := s.sendEmail(patient.Email, subject, body); err != nil {
		// Log notification failure
		s.logNotificationEvent("notification_failed", 0, appointmentID, patient.Email, err.Error())
		return fmt.Errorf("failed to send email: %w", err)
	}

	// Log notification success
	s.logNotificationEvent("notification_sent", 0, appointmentID, patient.Email, "")

	return nil
}

func (s *NotificationService) generateEmailBody(templateKey string, data EmailData) (string, error) {
	templ, exists := s.templates[templateKey]
	if !exists {
		return "", fmt.Errorf("template not found: %s", templateKey)
	}

	var buf bytes.Buffer
	if err := templ.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (s *NotificationService) sendEmail(to, subject, body string) error {
	input := &ses.SendEmailInput{
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(to)},
		},
		Message: &ses.Message{
			Body: &ses.Body{
				Text: &ses.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(body),
				},
			},
			Subject: &ses.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
		},
		Source: aws.String(s.fromEmail),
	}

	_, err := s.sesClient.SendEmail(input)
	return err
}

func (s *NotificationService) logNotificationEvent(event string, notificationID, appointmentID uint, email, errorMsg string) {
	// Mask email for logging
	maskedEmail := s.maskEmail(email)

	message := fmt.Sprintf("Notification %d for appointment %d to %s", notificationID, appointmentID, maskedEmail)
	if errorMsg != "" {
		message += ": " + errorMsg
	}

	s.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:   event,
		Message: message,
	})
}

func (s *NotificationService) maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}

	local := parts[0]
	domain := parts[1]

	if len(local) <= 2 {
		return "***@" + domain
	}

	return local[:2] + "***@" + domain
}

// Batch notification methods

func (s *NotificationService) SendAppointmentReminders() error {
	// Get upcoming appointments that need reminders (24 hours ahead)
	appointments, err := s.appointmentRepo.GetUpcomingAppointments(24)
	if err != nil {
		return fmt.Errorf("failed to get appointments: %w", err)
	}

	var errors []string
	for _, appointment := range appointments {
		if appointment.Status == models.AppointmentScheduled || appointment.Status == models.AppointmentConfirmed {
			if err := s.SendAppointmentReminder(appointment.ID); err != nil {
				errors = append(errors, fmt.Sprintf("appointment %d: %s", appointment.ID, err.Error()))
			}
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("failed to send some reminders: %s", strings.Join(errors, "; "))
	}

	return nil
}

// Notification history and status - These would need to be implemented with proper notification repository

func (s *NotificationService) GetNotificationHistory(appointmentID uint) ([]models.NotificationLog, error) {
	// TODO: Implement with notification repository when available
	return nil, fmt.Errorf("notification history not implemented - notification repository needed")
}

func (s *NotificationService) GetNotificationStatus(notificationID uint) (*models.NotificationLog, error) {
	// TODO: Implement with notification repository when available
	return nil, fmt.Errorf("notification status not implemented - notification repository needed")
}

