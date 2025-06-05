package repository

import (
	"fmt"
	"time"

	"backend/internal/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser creates a new user with profile
func (r *UserRepository) CreateUser(user *models.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
		return nil
	})
}

// GetUserByID retrieves a user by ID with profile
func (r *UserRepository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Profile").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by email with profile
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Profile").Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser updates user information
func (r *UserRepository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

// UpdateUserProfile updates user profile information
func (r *UserRepository) UpdateUserProfile(profile *models.UserProfile) error {
	return r.db.Save(profile).Error
}

// DeleteUser soft deletes a user
func (r *UserRepository) DeleteUser(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

// GetUsersByRole retrieves users by role
func (r *UserRepository) GetUsersByRole(role models.UserRole) ([]models.User, error) {
	var users []models.User
	err := r.db.Preload("Profile").Where("role = ? AND is_active = ?", role, true).Find(&users).Error
	return users, err
}

// EmailExists checks if email already exists
func (r *UserRepository) EmailExists(email string) (bool, error) {
	var count int64
	err := r.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

// CreateAuditLog creates an audit log entry
func (r *UserRepository) CreateAuditLog(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

// CreateUserSession creates a new user session
func (r *UserRepository) CreateUserSession(session *models.UserSession) error {
	return r.db.Create(session).Error
}

// GetUserSession retrieves a user session by token hash
func (r *UserRepository) GetUserSession(tokenHash string) (*models.UserSession, error) {
	var session models.UserSession
	err := r.db.Where("token = ? AND is_revoked = ? AND expires_at > ?", tokenHash, false, time.Now()).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// RevokeUserSession revokes a user session
func (r *UserRepository) RevokeUserSession(tokenHash string) error {
	now := time.Now()
	return r.db.Model(&models.UserSession{}).Where("token = ?", tokenHash).Updates(map[string]interface{}{
		"is_revoked": true,
		"revoked_at": &now,
	}).Error
}

// RevokeAllUserSessions revokes all sessions for a user
func (r *UserRepository) RevokeAllUserSessions(userID uint) error {
	now := time.Now()
	return r.db.Model(&models.UserSession{}).Where("user_id = ? AND is_revoked = ?", userID, false).Updates(map[string]interface{}{
		"is_revoked": true,
		"revoked_at": &now,
	}).Error
}

// CleanupExpiredSessions removes expired sessions
func (r *UserRepository) CleanupExpiredSessions() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&models.UserSession{}).Error
}

// GetActiveSessionsCount returns the number of active sessions for a user
func (r *UserRepository) GetActiveSessionsCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.UserSession{}).Where("user_id = ? AND is_revoked = ? AND expires_at > ?", userID, false, time.Now()).Count(&count).Error
	return count, err
}

// UpdatePassword updates user password
func (r *UserRepository) UpdatePassword(userID uint, hashedPassword string) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("password", hashedPassword).Error
}

// DeactivateUser deactivates a user account
func (r *UserRepository) DeactivateUser(userID uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("is_active", false).Error
}

// ActivateUser activates a user account
func (r *UserRepository) ActivateUser(userID uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("is_active", true).Error
}

