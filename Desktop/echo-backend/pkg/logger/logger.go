package logger

import (
	"go.uber.org/zap"
)

type Logger struct {
	*zap.Logger
}

type SecurityEvent struct {
	Event     string `json:"event"`
	UserID    uint   `json:"user_id,omitempty"`
	UserEmail string `json:"user_email,omitempty"`
	UserRole  string `json:"user_role,omitempty"`
	IPAddress string `json:"ip_address,omitempty"`
	UserAgent string `json:"user_agent,omitempty"`
	Endpoint  string `json:"endpoint,omitempty"`
	Method    string `json:"method,omitempty"`
	Message   string `json:"message,omitempty"`
}

func NewLogger(level, format string) (*Logger, error) {
	var config zap.Config

	if format == "json" {
		config = zap.NewProductionConfig()
	} else {
		config = zap.NewDevelopmentConfig()
	}

	// Set log level
	switch level {
	case "debug":
		config.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	case "info":
		config.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	case "warn":
		config.Level = zap.NewAtomicLevelAt(zap.WarnLevel)
	case "error":
		config.Level = zap.NewAtomicLevelAt(zap.ErrorLevel)
	default:
		config.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	}

	// Configure output
	config.OutputPaths = []string{"stdout"}
	config.ErrorOutputPaths = []string{"stderr"}

	zapLogger, err := config.Build()
	if err != nil {
		return nil, err
	}

	return &Logger{zapLogger}, nil
}

// Security event logging methods
func (l *Logger) LogSecurityEvent(event SecurityEvent) {
	fields := []zap.Field{
		zap.String("event", event.Event),
		zap.String("event_type", "security"),
	}

	if event.UserID != 0 {
		fields = append(fields, zap.Uint("user_id", event.UserID))
	}
	if event.UserEmail != "" {
		fields = append(fields, zap.String("user_email", event.UserEmail))
	}
	if event.UserRole != "" {
		fields = append(fields, zap.String("user_role", event.UserRole))
	}
	if event.IPAddress != "" {
		fields = append(fields, zap.String("ip_address", event.IPAddress))
	}
	if event.UserAgent != "" {
		fields = append(fields, zap.String("user_agent", event.UserAgent))
	}
	if event.Endpoint != "" {
		fields = append(fields, zap.String("endpoint", event.Endpoint))
	}
	if event.Method != "" {
		fields = append(fields, zap.String("method", event.Method))
	}

	l.Info(event.Message, fields...)
}

func (l *Logger) LogUserRegistration(userID uint, email, role, ipAddress string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "user_registration",
		UserID:    userID,
		UserEmail: email,
		UserRole:  role,
		IPAddress: ipAddress,
		Message:   "User registered successfully",
	})
}

func (l *Logger) LogUserLogin(userID uint, email, role, ipAddress, userAgent string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "user_login",
		UserID:    userID,
		UserEmail: email,
		UserRole:  role,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Message:   "User logged in successfully",
	})
}

func (l *Logger) LogFailedLogin(email, ipAddress, userAgent, reason string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "failed_login",
		UserEmail: email,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Message:   "Failed login attempt: " + reason,
	})
}

func (l *Logger) LogUnauthorizedAccess(userID uint, userRole, endpoint, method, ipAddress string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "unauthorized_access",
		UserID:    userID,
		UserRole:  userRole,
		Endpoint:  endpoint,
		Method:    method,
		IPAddress: ipAddress,
		Message:   "Unauthorized access attempt",
	})
}

func (l *Logger) LogPHIAccess(userID uint, userEmail, userRole, resource, action, ipAddress string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "phi_access",
		UserID:    userID,
		UserEmail: userEmail,
		UserRole:  userRole,
		IPAddress: ipAddress,
		Message:   "PHI access: " + action + " on " + resource,
	})
}

func (l *Logger) LogPasswordChange(userID uint, userEmail, ipAddress string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "password_change",
		UserID:    userID,
		UserEmail: userEmail,
		IPAddress: ipAddress,
		Message:   "User password changed",
	})
}

func (l *Logger) LogProfileUpdate(userID uint, userEmail, userRole, ipAddress string) {
	l.LogSecurityEvent(SecurityEvent{
		Event:     "profile_update",
		UserID:    userID,
		UserEmail: userEmail,
		UserRole:  userRole,
		IPAddress: ipAddress,
		Message:   "User profile updated",
	})
}

