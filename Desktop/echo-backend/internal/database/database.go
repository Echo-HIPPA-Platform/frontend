package database

import (
	"fmt"
	"log"

	"backend/internal/config"
	"backend/internal/models"
	"backend/pkg/auth"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect establishes a connection to the database
func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := cfg.GetDatabaseDSN()

	// Configure GORM logger
	logLevel := logger.Silent
	if cfg.Server.GinMode == "debug" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying sql.DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Configure connection pool for production use
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	return db, nil
}

// AutoMigrate runs database migrations
func AutoMigrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Create tables
	err := db.AutoMigrate(
		&models.User{},
		&models.UserProfile{},
		&models.DoctorProfile{},
		&models.AuditLog{},
		&models.UserSession{},
		&models.AdminAuditLog{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create indexes for better performance
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// createIndexes creates database indexes for better performance
func createIndexes(db *gorm.DB) error {
	// User indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)").Error; err != nil {
		return err
	}

	// User profile indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)").Error; err != nil {
		return err
	}

	// Doctor profile indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_doctor_profiles_license ON doctor_profiles(license_number)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialization ON doctor_profiles(specialization)").Error; err != nil {
		return err
	}

	// Audit log indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)").Error; err != nil {
		return err
	}

	// User session indexes
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_user_sessions_is_revoked ON user_sessions(is_revoked)").Error; err != nil {
		return err
	}

	// Admin audit log indexes for HIPAA compliance
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON admin_audit_logs(target_user_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON admin_audit_logs(resource_id)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_ip_address ON admin_audit_logs(ip_address)").Error; err != nil {
		return err
	}

	// Doctor profile verification status index
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verification_status ON doctor_profiles(verification_status)").Error; err != nil {
		return err
	}
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verified_by ON doctor_profiles(verified_by)").Error; err != nil {
		return err
	}

	return nil
}

// CreateAdminUser creates a default admin user if none exists
func CreateAdminUser(db *gorm.DB, email, password string) error {
	// Check if admin user already exists
	var count int64
	db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&count)
	if count > 0 {
		log.Println("Admin user already exists")
		return nil
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(password, 12)
	if err != nil {
		return fmt.Errorf("failed to hash admin password: %w", err)
	}

	// Create admin user
	admin := &models.User{
		Email:    email,
		Password: hashedPassword,
		Role:     models.RoleAdmin,
		IsActive: true,
		Profile: models.UserProfile{
			FirstName: "System",
			LastName:  "Administrator",
		},
	}

	if err := db.Create(admin).Error; err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	log.Printf("Admin user created with email: %s", email)
	return nil
}

