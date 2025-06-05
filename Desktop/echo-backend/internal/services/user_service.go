package services

import (
	"fmt"
	"time"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/auth"
	"backend/pkg/logger"
	"gorm.io/gorm"
)

type UserService struct {
	userRepo   *repository.UserRepository
	jwtManager *auth.JWTManager
	logger     *logger.Logger
	bcryptCost int
}

func NewUserService(userRepo *repository.UserRepository, jwtManager *auth.JWTManager, logger *logger.Logger, bcryptCost int) *UserService {
	return &UserService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
		logger:     logger,
		bcryptCost: bcryptCost,
	}
}

// RegisterUser registers a new user (patient or doctor)
func (s *UserService) RegisterUser(req *models.RegisterRequest, ipAddress string) (*models.LoginResponse, error) {
	// Validate password strength
	if err := auth.ValidatePassword(req.Password); err != nil {
		return nil, fmt.Errorf("password validation failed: %w", err)
	}

	// Check if email already exists
	exists, err := s.userRepo.EmailExists(req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("email already registered")
	}

	// Validate role
	if !req.Role.IsValid() || req.Role == models.RoleAdmin {
		return nil, fmt.Errorf("invalid role")
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password, s.bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user with profile
	user := &models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Role:     req.Role,
		IsActive: true,
		Profile: models.UserProfile{
			FirstName: req.FirstName,
			LastName:  req.LastName,
		},
	}

	// Create user in database
	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create user session
	tokenHash := auth.HashToken(token)
	session := &models.UserSession{
		UserID:    user.ID,
		Token:     tokenHash,
		IPAddress: ipAddress,
		ExpiresAt: time.Now().Add(24 * time.Hour), // TODO: Use config
	}

	if err := s.userRepo.CreateUserSession(session); err != nil {
		s.logger.Error("Failed to create user session: " + err.Error())
		// Don't fail registration, just log the error
	}

	// Log registration
	s.logger.LogUserRegistration(user.ID, user.Email, user.Role.String(), ipAddress)

	// Create audit log
	auditLog := &models.AuditLog{
		UserID:    user.ID,
		Action:    "user_registration",
		Resource:  "user",
		Details:   fmt.Sprintf("User registered with role: %s", user.Role),
		IPAddress: ipAddress,
	}
	s.userRepo.CreateAuditLog(auditLog)

	return &models.LoginResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// LoginUser authenticates a user and returns a JWT token
func (s *UserService) LoginUser(req *models.LoginRequest, ipAddress, userAgent string) (*models.LoginResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.LogFailedLogin(req.Email, ipAddress, userAgent, "user not found")
			return nil, fmt.Errorf("invalid credentials")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		s.logger.LogFailedLogin(req.Email, ipAddress, userAgent, "account deactivated")
		return nil, fmt.Errorf("account is deactivated")
	}

	// Check password
	if err := auth.CheckPassword(user.Password, req.Password); err != nil {
		s.logger.LogFailedLogin(req.Email, ipAddress, userAgent, "invalid password")
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create user session
	tokenHash := auth.HashToken(token)
	session := &models.UserSession{
		UserID:    user.ID,
		Token:     tokenHash,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		ExpiresAt: time.Now().Add(24 * time.Hour), // TODO: Use config
	}

	if err := s.userRepo.CreateUserSession(session); err != nil {
		s.logger.Error("Failed to create user session: " + err.Error())
		// Don't fail login, just log the error
	}

	// Log successful login
	s.logger.LogUserLogin(user.ID, user.Email, user.Role.String(), ipAddress, userAgent)

	// Create audit log
	auditLog := &models.AuditLog{
		UserID:    user.ID,
		Action:    "user_login",
		Resource:  "user",
		Details:   "User logged in successfully",
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}
	s.userRepo.CreateAuditLog(auditLog)

	return &models.LoginResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// GetUserProfile gets user profile by ID
func (s *UserService) GetUserProfile(userID uint) (*models.UserResponse, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	response := user.ToResponse()
	return &response, nil
}

// UpdateUserProfile updates user profile information
func (s *UserService) UpdateUserProfile(userID uint, req *models.UpdateProfileRequest, ipAddress string) (*models.UserResponse, error) {
	// Get existing user
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Update profile fields if provided
	if req.FirstName != "" {
		user.Profile.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.Profile.LastName = req.LastName
	}
	if req.DateOfBirth != nil {
		user.Profile.DateOfBirth = req.DateOfBirth
	}
	if req.Phone != "" {
		user.Profile.Phone = req.Phone
	}
	if req.Address != "" {
		user.Profile.Address = req.Address
	}
	if req.City != "" {
		user.Profile.City = req.City
	}
	if req.State != "" {
		user.Profile.State = req.State
	}
	if req.ZipCode != "" {
		user.Profile.ZipCode = req.ZipCode
	}
	if req.Country != "" {
		user.Profile.Country = req.Country
	}

	// Update profile in database
	if err := s.userRepo.UpdateUserProfile(&user.Profile); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	// Log profile update
	s.logger.LogProfileUpdate(user.ID, user.Email, user.Role.String(), ipAddress)

	// Create audit log
	auditLog := &models.AuditLog{
		UserID:    user.ID,
		Action:    "profile_update",
		Resource:  "user_profile",
		Details:   "User profile updated",
		IPAddress: ipAddress,
	}
	s.userRepo.CreateAuditLog(auditLog)

	// Return updated user
	updatedUser, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated user: %w", err)
	}

	response := updatedUser.ToResponse()
	return &response, nil
}

// ChangePassword changes user password
func (s *UserService) ChangePassword(userID uint, oldPassword, newPassword, ipAddress string) error {
	// Validate new password
	if err := auth.ValidatePassword(newPassword); err != nil {
		return fmt.Errorf("password validation failed: %w", err)
	}

	// Get user
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify old password
	if err := auth.CheckPassword(user.Password, oldPassword); err != nil {
		return fmt.Errorf("invalid current password")
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(newPassword, s.bcryptCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	if err := s.userRepo.UpdatePassword(userID, hashedPassword); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Revoke all existing sessions for security
	if err := s.userRepo.RevokeAllUserSessions(userID); err != nil {
		s.logger.Error("Failed to revoke user sessions after password change: " + err.Error())
	}

	// Log password change
	s.logger.LogPasswordChange(user.ID, user.Email, ipAddress)

	// Create audit log
	auditLog := &models.AuditLog{
		UserID:    user.ID,
		Action:    "password_change",
		Resource:  "user",
		Details:   "User password changed",
		IPAddress: ipAddress,
	}
	s.userRepo.CreateAuditLog(auditLog)

	return nil
}

// LogoutUser revokes the user's session
func (s *UserService) LogoutUser(token string) error {
	tokenHash := auth.HashToken(token)
	return s.userRepo.RevokeUserSession(tokenHash)
}

// ValidateSession checks if a session is valid
func (s *UserService) ValidateSession(token string) (*models.UserSession, error) {
	tokenHash := auth.HashToken(token)
	return s.userRepo.GetUserSession(tokenHash)
}

