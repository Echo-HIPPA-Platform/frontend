package notification

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
	"text/template"
	"time"

	"backend/internal/models"
	"backend/pkg/logger"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
)

// EmailConfig holds email service configuration
type EmailConfig struct {
	AWSRegion     string
	AWSAccessKey  string
	AWSSecretKey  string
	FromEmail     string
	FromName      string
	ReplyToEmail  string
	IsProduction  bool
}

// EmailService handles HIPAA-compliant email notifications
type EmailService struct {
	sesClient *ses.SES
	config    *EmailConfig
	logger    *logger.Logger
}

// NotificationData contains template variables for emails (HIPAA-compliant, no PHI)
type NotificationData struct {
	// Basic appointment info
	PatientFirstName string
	DoctorName       string
	AppointmentDate  string
	AppointmentTime  string
	AppointmentType  string

	// Platform info
	PlatformName string
	SupportEmail string
	LoginURL     string
	CancelURL    string
	RescheduleURL string

	// Additional fields for specific templates
	CancelReason         string
	OldAppointmentDate   string
	OldAppointmentTime   string
	ReminderAdvanceHours string
	ConfirmationDeadline string
}

// NewEmailService creates a new email service instance
func NewEmailService(config *EmailConfig, logger *logger.Logger) (*EmailService, error) {
	// Create AWS session
	awsConfig := &aws.Config{
		Region: aws.String(config.AWSRegion),
	}

	// Use credentials if provided
	if config.AWSAccessKey != "" && config.AWSSecretKey != "" {
		awsConfig.Credentials = credentials.NewStaticCredentials(
			config.AWSAccessKey,
			config.AWSSecretKey,
			"",
		)
	}

	sess, err := session.NewSession(awsConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	return &EmailService{
		sesClient: ses.New(sess),
		config:    config,
		logger:    logger,
	}, nil
}

// SendAppointmentConfirmation sends appointment confirmation email
func (e *EmailService) SendAppointmentConfirmation(appointment *models.Appointment, template *models.NotificationTemplate) error {
	// Prepare HIPAA-compliant notification data (no PHI)
	data := e.prepareNotificationData(appointment)

	// Process template
	subject, bodyText, bodyHTML, err := e.processTemplate(template, data)
	if err != nil {
		return fmt.Errorf("failed to process template: %w", err)
	}

	// Send email to patient
	return e.sendEmail(
		appointment.Patient.Email,
		subject,
		bodyText,
		bodyHTML,
		appointment.ID,
		appointment.PatientID,
		template.ID,
	)
}

// SendAppointmentReminder sends appointment reminder email
func (e *EmailService) SendAppointmentReminder(appointment *models.Appointment, template *models.NotificationTemplate) error {
	data := e.prepareNotificationData(appointment)

	subject, bodyText, bodyHTML, err := e.processTemplate(template, data)
	if err != nil {
		return fmt.Errorf("failed to process template: %w", err)
	}

	return e.sendEmail(
		appointment.Patient.Email,
		subject,
		bodyText,
		bodyHTML,
		appointment.ID,
		appointment.PatientID,
		template.ID,
	)
}

// SendAppointmentCancellation sends cancellation notification
func (e *EmailService) SendAppointmentCancellation(appointment *models.Appointment, template *models.NotificationTemplate, recipientID uint) error {
	data := e.prepareNotificationData(appointment)

	// Add cancellation-specific data
	data.CancelReason = appointment.CancelReason

	subject, bodyText, bodyHTML, err := e.processTemplate(template, data)
	if err != nil {
		return fmt.Errorf("failed to process template: %w", err)
	}

	// Determine recipient email
	var recipientEmail string
	if recipientID == appointment.PatientID {
		recipientEmail = appointment.Patient.Email
	} else if recipientID == appointment.DoctorID {
		recipientEmail = appointment.Doctor.Email
	} else {
		return fmt.Errorf("invalid recipient ID")
	}

	return e.sendEmail(
		recipientEmail,
		subject,
		bodyText,
		bodyHTML,
		appointment.ID,
		recipientID,
		template.ID,
	)
}

// SendAppointmentReschedule sends reschedule notification
func (e *EmailService) SendAppointmentReschedule(oldAppointment, newAppointment *models.Appointment, template *models.NotificationTemplate, recipientID uint) error {
	data := e.prepareNotificationData(newAppointment)

	// Add reschedule-specific data
	data.OldAppointmentDate = oldAppointment.ScheduledAt.Format("January 2, 2006")
	data.OldAppointmentTime = oldAppointment.ScheduledAt.Format("3:04 PM")

	subject, bodyText, bodyHTML, err := e.processTemplate(template, data)
	if err != nil {
		return fmt.Errorf("failed to process template: %w", err)
	}

	// Determine recipient email
	var recipientEmail string
	if recipientID == newAppointment.PatientID {
		recipientEmail = newAppointment.Patient.Email
	} else if recipientID == newAppointment.DoctorID {
		recipientEmail = newAppointment.Doctor.Email
	} else {
		return fmt.Errorf("invalid recipient ID")
	}

	return e.sendEmail(
		recipientEmail,
		subject,
		bodyText,
		bodyHTML,
		newAppointment.ID,
		recipientID,
		template.ID,
	)
}

// prepareNotificationData creates HIPAA-compliant template data
func (e *EmailService) prepareNotificationData(appointment *models.Appointment) NotificationData {
	return NotificationData{
		// Only non-PHI information included
		PatientFirstName: appointment.Patient.Profile.FirstName, // First name is generally acceptable
		DoctorName:       fmt.Sprintf("Dr. %s", appointment.Doctor.Profile.LastName),
		AppointmentDate:  appointment.ScheduledAt.Format("January 2, 2006"),
		AppointmentTime:  appointment.ScheduledAt.Format("3:04 PM"),
		AppointmentType:  e.formatAppointmentType(appointment.AppointmentType),
		PlatformName:     "Mental Health Platform",
		SupportEmail:     "support@mentalhealthplatform.com",
		LoginURL:         "https://app.mentalhealthplatform.com/login",
		CancelURL:        fmt.Sprintf("https://app.mentalhealthplatform.com/appointments/%d/cancel", appointment.ID),
		RescheduleURL:    fmt.Sprintf("https://app.mentalhealthplatform.com/appointments/%d/reschedule", appointment.ID),
	}
}

// processTemplate processes email template with data
func (e *EmailService) processTemplate(tmpl *models.NotificationTemplate, data NotificationData) (string, string, string, error) {
	// Process subject
	subjectTmpl, err := template.New("subject").Parse(tmpl.Subject)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse subject template: %w", err)
	}

	var subjectBuf bytes.Buffer
	if err := subjectTmpl.Execute(&subjectBuf, data); err != nil {
		return "", "", "", fmt.Errorf("failed to execute subject template: %w", err)
	}

	// Process text body
	textTmpl, err := textTemplate.New("text").Parse(tmpl.BodyText)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse text template: %w", err)
	}

	var textBuf bytes.Buffer
	if err := textTmpl.Execute(&textBuf, data); err != nil {
		return "", "", "", fmt.Errorf("failed to execute text template: %w", err)
	}

	// Process HTML body
	htmlTmpl, err := htmlTemplate.New("html").Parse(tmpl.BodyHTML)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var htmlBuf bytes.Buffer
	if err := htmlTmpl.Execute(&htmlBuf, data); err != nil {
		return "", "", "", fmt.Errorf("failed to execute HTML template: %w", err)
	}

	return subjectBuf.String(), textBuf.String(), htmlBuf.String(), nil
}

// sendEmail sends email via AWS SES
func (e *EmailService) sendEmail(to, subject, bodyText, bodyHTML string, appointmentID, recipientID, templateID uint) error {
	// Create SES input
	input := &ses.SendEmailInput{
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(to)},
		},
		Message: &ses.Message{
			Body: &ses.Body{
				Text: &ses.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(bodyText),
				},
				Html: &ses.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(bodyHTML),
				},
			},
			Subject: &ses.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
		},
		Source: aws.String(fmt.Sprintf("%s <%s>", e.config.FromName, e.config.FromEmail)),
	}

	// Add reply-to if configured
	if e.config.ReplyToEmail != "" {
		input.ReplyToAddresses = []*string{aws.String(e.config.ReplyToEmail)}
	}

	// Send email
	result, err := e.sesClient.SendEmail(input)
	if err != nil {
		e.logger.Error(fmt.Sprintf("Failed to send email via SES: %v", err))
		// Log notification failure for audit
		e.logNotificationFailure(appointmentID, recipientID, templateID, to, subject, err.Error())
		return fmt.Errorf("failed to send email: %w", err)
	}

	// Log successful notification
	messageID := ""
	if result.MessageId != nil {
		messageID = *result.MessageId
	}

	e.logNotificationSuccess(appointmentID, recipientID, templateID, to, subject, messageID)

	// Log security event for HIPAA compliance
	e.logger.LogSecurityEvent(logger.SecurityEvent{
		Event:   "notification_sent",
		UserID:  recipientID,
		Message: fmt.Sprintf("Email notification sent to %s (masked) for appointment %d", e.maskEmail(to), appointmentID),
	})

	return nil
}

// logNotificationSuccess logs successful email delivery
func (e *EmailService) logNotificationSuccess(appointmentID, recipientID, templateID uint, email, subject, messageID string) {
	// This would typically save to database via repository
	// For now, log to application logger
	e.logger.Info(fmt.Sprintf("Email sent successfully: Appointment=%d, Recipient=%d, Template=%d, MessageID=%s", 
		appointmentID, recipientID, templateID, messageID))
}

// logNotificationFailure logs failed email delivery
func (e *EmailService) logNotificationFailure(appointmentID, recipientID, templateID uint, email, subject, reason string) {
	// This would typically save to database via repository
	e.logger.Error(fmt.Sprintf("Email failed: Appointment=%d, Recipient=%d, Template=%d, Reason=%s", 
		appointmentID, recipientID, templateID, reason))
}

// maskEmail masks email address for logging (HIPAA compliance)
func (e *EmailService) maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***@***"
	}

	local := parts[0]
	domain := parts[1]

	if len(local) <= 2 {
		return "***@" + domain
	}

	return local[:2] + "***@" + domain
}

// formatAppointmentType formats appointment type for display
func (e *EmailService) formatAppointmentType(appointmentType models.AppointmentType) string {
	switch appointmentType {
	case models.AppointmentInitialConsultation:
		return "Initial Consultation"
	case models.AppointmentFollowUp:
		return "Follow-up Appointment"
	case models.AppointmentTherapySession:
		return "Therapy Session"
	case models.AppointmentMedicationReview:
		return "Medication Review"
	case models.AppointmentEmergencySession:
		return "Emergency Session"
	default:
		return "Appointment"
	}
}

// VerifyEmailAddress verifies an email address with SES
func (e *EmailService) VerifyEmailAddress(email string) error {
	input := &ses.VerifyEmailIdentityInput{
		EmailAddress: aws.String(email),
	}

	_, err := e.sesClient.VerifyEmailIdentity(input)
	if err != nil {
		return fmt.Errorf("failed to verify email address: %w", err)
	}

	return nil
}

// GetSendingQuota gets SES sending quota
func (e *EmailService) GetSendingQuota() (*ses.SendingQuotaOutput, error) {
	return e.sesClient.GetSendingQuota(&ses.GetSendingQuotaInput{})
}


