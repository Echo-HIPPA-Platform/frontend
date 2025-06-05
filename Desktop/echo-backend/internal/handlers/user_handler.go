package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	userService *services.UserService
	logger      *logger.Logger
	validator   *validator.Validate
}

func NewUserHandler(userService *services.UserService, logger *logger.Logger) *UserHandler {
	return &UserHandler{
		userService: userService,
		logger:      logger,
		validator:   validator.New(),
	}
}

// RegisterUser handles user registration
// @Summary Register a new user
// @Description Register a new patient or doctor
// @Tags auth
// @Accept json
// @Produce json
// @Param user body models.RegisterRequest true "User registration data"
// @Success 201 {object} models.LoginResponse
// @Failure 400 {object} gin.H
// @Failure 409 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /auth/register [post]
func (h *UserHandler) RegisterUser(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Register user
	response, err := h.userService.RegisterUser(&req, c.ClientIP())
	if err != nil {
		h.logger.Error("Failed to register user: " + err.Error())
		
		// Handle specific errors
		if err.Error() == "email already registered" {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
		if err.Error() == "invalid role" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// LoginUser handles user login
// @Summary Login user
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body models.LoginRequest true "User login credentials"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /auth/login [post]
func (h *UserHandler) LoginUser(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Login user
	response, err := h.userService.LoginUser(&req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		h.logger.Error("Failed to login user: " + err.Error())
		
		// Handle specific errors
		if err.Error() == "invalid credentials" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		if err.Error() == "account is deactivated" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is deactivated"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to login"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetUserProfile handles getting current user profile
// @Summary Get user profile
// @Description Get the current user's profile information
// @Tags users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.UserResponse
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /users/me [get]
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID, _, userRole, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	// Log PHI access
	h.logger.LogPHIAccess(userID, "", userRole.String(), "user_profile", "read", c.ClientIP())

	// Get user profile
	response, err := h.userService.GetUserProfile(userID)
	if err != nil {
		h.logger.Error("Failed to get user profile: " + err.Error())
		
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserProfile handles updating user profile
// @Summary Update user profile
// @Description Update the current user's profile information
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param profile body models.UpdateProfileRequest true "Profile update data"
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /users/me [put]
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	userID, userEmail, userRole, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Log PHI access
	h.logger.LogPHIAccess(userID, userEmail, userRole.String(), "user_profile", "update", c.ClientIP())

	// Update user profile
	response, err := h.userService.UpdateUserProfile(userID, &req, c.ClientIP())
	if err != nil {
		h.logger.Error("Failed to update user profile: " + err.Error())
		
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user profile"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ChangePassword handles password change
// @Summary Change password
// @Description Change the current user's password
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param passwords body gin.H true "Password change data"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /users/me/password [put]
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	var req struct {
		OldPassword string `json:"old_password" validate:"required,min=8"`
		NewPassword string `json:"new_password" validate:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": err.Error()})
		return
	}

	// Change password
	if err := h.userService.ChangePassword(userID, req.OldPassword, req.NewPassword, c.ClientIP()); err != nil {
		h.logger.Error("Failed to change password: " + err.Error())
		
		if err.Error() == "invalid current password" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid current password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// LogoutUser handles user logout
// @Summary Logout user
// @Description Logout user and revoke session
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /auth/logout [post]
func (h *UserHandler) LogoutUser(c *gin.Context) {
	// Extract token from header
	auth := c.GetHeader("Authorization")
	if auth == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
		return
	}

	// Parse Bearer token
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
		return
	}

	token := parts[1]

	// Logout user
	if err := h.userService.LogoutUser(token); err != nil {
		h.logger.Error("Failed to logout user: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetUserByID handles getting a specific user by ID (admin only)
// @Summary Get user by ID
// @Description Get a specific user's information (admin only)
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	currentUserID, currentUserEmail, currentUserRole, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	// Get user ID from path
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user is accessing their own profile or is admin
	if uint(userID) != currentUserID && currentUserRole != models.RoleAdmin {
		h.logger.LogUnauthorizedAccess(currentUserID, currentUserRole.String(), c.Request.URL.Path, c.Request.Method, c.ClientIP())
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Log PHI access
	h.logger.LogPHIAccess(currentUserID, currentUserEmail, currentUserRole.String(), "user_profile", "read", c.ClientIP())

	// Get user profile
	response, err := h.userService.GetUserProfile(uint(userID))
	if err != nil {
		h.logger.Error("Failed to get user profile: " + err.Error())
		
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	c.JSON(http.StatusOK, response)
}

