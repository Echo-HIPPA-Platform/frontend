package main

import (
	"log"
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/services"
	"backend/pkg/auth"
	"backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	appLogger, err := logger.NewLogger(cfg.Logging.Level, cfg.Logging.Format)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer appLogger.Sync()

	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		appLogger.Fatal("Failed to connect to database: " + err.Error())
	}

	// Run migrations
	if err := database.AutoMigrate(db); err != nil {
		appLogger.Fatal("Failed to run database migrations: " + err.Error())
	}

	// Create default admin user (only in development)
	if cfg.Server.GinMode == "debug" {
		if err := database.CreateAdminUser(db, "admin@example.com", "Admin123!"); err != nil {
			appLogger.Error("Failed to create admin user: " + err.Error())
		}
	}

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(cfg.JWT.Secret, cfg.GetJWTExpiry())

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	adminRepo := repository.NewAdminRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo, jwtManager, appLogger, cfg.Security.BcryptCost)
	adminService := services.NewAdminService(adminRepo, userRepo, appLogger)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager, appLogger)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService, appLogger)
	adminHandler := handlers.NewAdminHandler(adminService, appLogger)

	// Initialize router
	router := setupRouter(userHandler, adminHandler, authMiddleware)

	// Start server
	appLogger.Info("Starting server on port " + cfg.Server.Port)
	server := &http.Server{
		Addr:           ":" + cfg.Server.Port,
		Handler:        router,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   15 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		appLogger.Fatal("Failed to start server: " + err.Error())
	}
}

func setupRouter(userHandler *handlers.UserHandler, adminHandler *handlers.AdminHandler, authMiddleware *middleware.AuthMiddleware) *gin.Engine {
	router := gin.New()

	// Global middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())
	router.Use(securityHeaders())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"service":   "mental-health-platform",
		})
	})

	// API version 1
	v1 := router.Group("/api/v1")

	// Authentication routes (public)
	auth := v1.Group("/auth")
	{
		auth.POST("/register", userHandler.RegisterUser)
		auth.POST("/login", userHandler.LoginUser)
		auth.POST("/logout", authMiddleware.AuthRequired(), userHandler.LogoutUser)
	}

	// User routes (protected)
	users := v1.Group("/users")
	users.Use(authMiddleware.AuthRequired())
	{
		// Current user profile
		users.GET("/me", authMiddleware.LogPHIAccess("user_profile", "read"), userHandler.GetUserProfile)
		users.PUT("/me", authMiddleware.LogPHIAccess("user_profile", "update"), userHandler.UpdateUserProfile)
		users.PUT("/me/password", userHandler.ChangePassword)

		// Admin only - get specific user by ID
		users.GET("/:id", authMiddleware.RequireAdmin(), authMiddleware.LogPHIAccess("user_profile", "admin_read"), userHandler.GetUserByID)
	}

	// Patient-only routes
	patients := v1.Group("/patients")
	patients.Use(authMiddleware.AuthRequired())
	patients.Use(authMiddleware.RequirePatient())
	{
		// TODO: Add patient-specific endpoints
		// patients.GET("/appointments", ...)
		// patients.POST("/appointments", ...)
	}

	// Doctor-only routes
	doctors := v1.Group("/doctors")
	doctors.Use(authMiddleware.AuthRequired())
	doctors.Use(authMiddleware.RequireDoctor())
	{
		// TODO: Add doctor-specific endpoints
		// doctors.GET("/patients", ...)
		// doctors.GET("/schedule", ...)
	}

	// Admin-only routes - Protected by RBAC middleware
	admin := v1.Group("/admin")
	admin.Use(authMiddleware.AuthRequired())
	admin.Use(authMiddleware.RequireAdmin())
	{
		// Dashboard and Statistics
		admin.GET("/dashboard", adminHandler.GetDashboard)

		// Doctor Management
		admin.GET("/doctors", authMiddleware.LogPHIAccess("doctor_profiles", "admin_view_list"), adminHandler.GetDoctors)
		admin.GET("/doctors/:id", authMiddleware.LogPHIAccess("doctor_profile", "admin_view_details"), adminHandler.GetDoctorByID)
		admin.PUT("/doctors/:id/verify", authMiddleware.LogPHIAccess("doctor_profile", "admin_verification"), adminHandler.VerifyDoctor)

		// User Management
		admin.GET("/users", authMiddleware.LogPHIAccess("users", "admin_view_list"), adminHandler.GetUsers)
		admin.PUT("/users/:id/status", authMiddleware.LogPHIAccess("user", "admin_status_change"), adminHandler.ToggleUserStatus)

		// HIPAA Audit Trail Management
		admin.GET("/audit-logs", adminHandler.GetAuditLogs)
	}

	return router
}

// corsMiddleware handles CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*") // Configure appropriately for production
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// securityHeaders adds security headers
func securityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HIPAA compliance security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'none'; frame-src 'none'; worker-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")

		c.Next()
	}
}

