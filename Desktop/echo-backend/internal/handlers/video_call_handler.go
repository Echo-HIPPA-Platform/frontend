package handlers

import (
	"backend/internal/models"
	"backend/internal/services"
	"backend/pkg/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

type VideoCallHandler struct {
	videoCallService *services.VideoCallService
	logger           *logger.Logger
}

func NewVideoCallHandler(videoCallService *services.VideoCallService, logger *logger.Logger) *VideoCallHandler {
	return &VideoCallHandler{
		videoCallService: videoCallService,
		logger:           logger,
	}
}

// GenerateToken issues a Twilio video access token for a session
// POST /api/v1/video/token
func (h *VideoCallHandler) GenerateToken(c *gin.Context) {
	var req models.VideoCallTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Use anonymous user ID (0) since no authentication
	tokenResp, err := h.videoCallService.GenerateAccessToken(0, req.SessionID, ipAddress, userAgent)
	if err != nil {
		h.logger.Error("Failed to generate video call token: " + err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResp)
}

// CreateSession creates a new video call session
// POST /api/v1/video/session
func (h *VideoCallHandler) CreateSession(c *gin.Context) {
	var req models.CreateVideoCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Use anonymous user ID (0) since no authentication
	sessionResp, err := h.videoCallService.CreateVideoCallSession(0, &req, ipAddress, userAgent)
	if err != nil {
		h.logger.Error("Failed to create video call session: " + err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sessionResp)
}
