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
	"backend/internal/routes"
	"backend/internal/services"
	"backend/pkg/auth"
	"backend/pkg/logger"
	"backend/pkg/twilio"

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
		if err := database.CreateAdminUser(db, "reaganprezzo@gmail.com", "Admin@5607!"); err != nil {
			appLogger.Error("Failed to create admin user: " + err.Error())
		}
	}

	// --- DEPENDENCY INJECTION ---

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(cfg.JWT.Secret, cfg.GetJWTExpiry())

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	adminRepo := repository.NewAdminRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	videoCallRepo := repository.NewVideoCallRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo, jwtManager, appLogger, cfg.Security.BcryptCost)
	adminService := services.NewAdminService(adminRepo, userRepo, appLogger)

	// Initialize notification service (without NotificationRepository since it doesn't exist)
	//fromEmail := "noreply@echopsychology.com" // Replace with your verified email
	//notificationService, err := services.NewNotificationService(appointmentRepo, userRepo, appLogger, fromEmail)
	if err != nil {
		appLogger.Error("Failed to initialize notification service: " + err.Error())
		// Continue without notification service for now
	}

	// Initialize appointment service (without notification service dependency)
	appointmentService := services.NewAppointmentService(appointmentRepo, userRepo, appLogger)
	paymentService := services.NewPaymentService(cfg, appLogger)

	// Initialize Twilio video service
	twilioService, err := twilio.NewVideoService(appLogger)
	if err != nil {
		appLogger.Fatal("Failed to initialize Twilio video service: " + err.Error())
	}

	videoCallService := services.NewVideoCallService(videoCallRepo, appointmentRepo, userRepo, twilioService, appLogger)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager, appLogger)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService, appLogger)
	adminHandler := handlers.NewAdminHandler(adminService, appLogger)
	appointmentHandler := handlers.NewAppointmentHandler(appointmentService, appLogger)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	videoCallHandler := handlers.NewVideoCallHandler(videoCallService, appLogger)

	// Initialize router with ALL handlers
	router := setupRouter(userHandler, adminHandler, appointmentHandler, paymentHandler, videoCallHandler, authMiddleware)

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

// --- FIX: Updated router setup to accept all handlers ---
func setupRouter(
	userHandler *handlers.UserHandler,
	adminHandler *handlers.AdminHandler,
	appointmentHandler *handlers.AppointmentHandler,
	paymentHandler *handlers.PaymentHandler,
	videoCallHandler *handlers.VideoCallHandler,
	authMiddleware *middleware.AuthMiddleware,
) *gin.Engine {
	router := gin.New()

	// Global middleware & Health check (Unchanged)
	router.Use(gin.Logger(), gin.Recovery(), corsMiddleware(), securityHeaders())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":   "mental-health-platform",
			"status":    "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	v1 := router.Group("/api/v1")

	// --- All Route Groups ---

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
		users.GET("/me", authMiddleware.LogPHIAccess("user_profile", "read"), userHandler.GetUserProfile)
		users.PUT("/me", authMiddleware.LogPHIAccess("user_profile", "update"), userHandler.UpdateUserProfile)
		users.PUT("/me/password", userHandler.ChangePassword)
		users.GET("/:id", authMiddleware.RequireAdmin(), authMiddleware.LogPHIAccess("user_profile", "admin_read"), userHandler.GetUserByID)
	}

	// --- FIX: Add Appointment Routes ---
	appointments := v1.Group("/appointments")
	appointments.Use(authMiddleware.AuthRequired())
	{
		// Patients can book appointments
		appointments.POST("", authMiddleware.RequirePatient(), appointmentHandler.BookAppointment)
		// Get specific appointment
		appointments.GET("/:id", appointmentHandler.GetAppointment)
		// Reschedule appointment
		appointments.PUT("/:id/reschedule", appointmentHandler.RescheduleAppointment)
		// Cancel appointment
		appointments.PUT("/:id/cancel", appointmentHandler.CancelAppointment)
	}

	// --- FIX: Add Payment Routes ---
	payments := v1.Group("/payments")
	payments.Use(authMiddleware.AuthRequired())
	{
		payments.POST("/verify", paymentHandler.VerifyPayment)
	}

	// Register video call routes
	routes.RegisterVideoCallRoutes(v1, videoCallHandler, authMiddleware)

	// Doctor-only routes (placeholders)
	doctors := v1.Group("/doctors")
	doctors.Use(authMiddleware.AuthRequired(), authMiddleware.RequireDoctor())
	{
		// TODO: Add doctor-specific endpoints like setting availability
	}

	// Admin-only routes
	admin := v1.Group("/admin")
	admin.Use(authMiddleware.AuthRequired(), authMiddleware.RequireAdmin())
	{
		admin.GET("/dashboard", adminHandler.GetDashboard)
		admin.GET("/doctors", adminHandler.GetDoctors)
		admin.GET("/doctors/:id", adminHandler.GetDoctorByID)
		admin.PUT("/doctors/:id/verify", adminHandler.VerifyDoctor)
		admin.GET("/users", adminHandler.GetUsers)
		admin.PUT("/users/:id/status", adminHandler.ToggleUserStatus)
		admin.GET("/audit-logs", adminHandler.GetAuditLogs)
	}

	return router
}

// corsMiddleware handles Cross-Origin Resource Sharing
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization, X-CSRF-Token")
		c.Header("Access-Control-Expose-Headers", "Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// securityHeaders adds security headers for HIPAA compliance
func securityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent XSS attacks
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")

		// Force HTTPS in production
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// Content Security Policy
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'")

		// Referrer Policy for privacy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Feature Policy
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		c.Next()
	}
}
