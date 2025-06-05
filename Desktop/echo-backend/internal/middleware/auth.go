package middleware

import (
	"net/http"
	"strings"

	"backend/internal/models"
	"backend/pkg/auth"
	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	jwtManager *auth.JWTManager
	logger     *logger.Logger
}

func NewAuthMiddleware(jwtManager *auth.JWTManager, logger *logger.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		jwtManager: jwtManager,
		logger:     logger,
	}
}

// AuthRequired middleware validates JWT token and adds user info to context
func (m *AuthMiddleware) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			m.logger.LogFailedLogin("", c.ClientIP(), c.GetHeader("User-Agent"), "missing token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		claims, err := m.jwtManager.ValidateToken(token)
		if err != nil {
			m.logger.LogFailedLogin("", c.ClientIP(), c.GetHeader("User-Agent"), "invalid token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Add user info to context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)

		c.Next()
	}
}

// RequireRole middleware checks if user has required role
func (m *AuthMiddleware) RequireRole(allowedRoles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User role not found in context"})
			c.Abort()
			return
		}

		role, ok := userRole.(models.UserRole)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role type"})
			c.Abort()
			return
		}

		// Check if user role is in allowed roles
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				c.Next()
				return
			}
		}

		// Log unauthorized access attempt
		userID, _ := c.Get("user_id")
		m.logger.LogUnauthorizedAccess(
			userID.(uint),
			role.String(),
			c.Request.URL.Path,
			c.Request.Method,
			c.ClientIP(),
		)

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

// RequirePatient middleware allows only patients
func (m *AuthMiddleware) RequirePatient() gin.HandlerFunc {
	return m.RequireRole(models.RolePatient)
}

// RequireDoctor middleware allows only doctors
func (m *AuthMiddleware) RequireDoctor() gin.HandlerFunc {
	return m.RequireRole(models.RoleDoctor)
}

// RequireAdmin middleware allows only admins
func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return m.RequireRole(models.RoleAdmin)
}

// RequireDoctorOrAdmin middleware allows doctors or admins
func (m *AuthMiddleware) RequireDoctorOrAdmin() gin.HandlerFunc {
	return m.RequireRole(models.RoleDoctor, models.RoleAdmin)
}

// RequirePatientOrDoctor middleware allows patients or doctors
func (m *AuthMiddleware) RequirePatientOrDoctor() gin.HandlerFunc {
	return m.RequireRole(models.RolePatient, models.RoleDoctor)
}

// RequireAnyAuthenticated middleware allows any authenticated user
func (m *AuthMiddleware) RequireAnyAuthenticated() gin.HandlerFunc {
	return m.RequireRole(models.RolePatient, models.RoleDoctor, models.RoleAdmin)
}

// LogPHIAccess middleware logs PHI access for HIPAA compliance
func (m *AuthMiddleware) LogPHIAccess(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		userEmail, _ := c.Get("user_email")
		userRole, _ := c.Get("user_role")

		m.logger.LogPHIAccess(
			userID.(uint),
			userEmail.(string),
			userRole.(models.UserRole).String(),
			resource,
			action,
			c.ClientIP(),
		)

		c.Next()
	}
}

// extractToken extracts JWT token from Authorization header
func extractToken(c *gin.Context) string {
	auth := c.GetHeader("Authorization")
	if auth == "" {
		return ""
	}

	// Check for Bearer token format
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

// GetUserFromContext extracts user information from gin context
func GetUserFromContext(c *gin.Context) (uint, string, models.UserRole, bool) {
	userID, exists1 := c.Get("user_id")
	userEmail, exists2 := c.Get("user_email")
	userRole, exists3 := c.Get("user_role")

	if !exists1 || !exists2 || !exists3 {
		return 0, "", "", false
	}

	return userID.(uint), userEmail.(string), userRole.(models.UserRole), true
}

