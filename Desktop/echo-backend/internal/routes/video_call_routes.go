package routes

import (
	"backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterVideoCallRoutes(rg *gin.RouterGroup, handler *handlers.VideoCallHandler, _ interface{}) {
	video := rg.Group("/video")
	// No auth middleware applied
	{
		video.POST("/token", handler.GenerateToken)
		video.POST("/session", handler.CreateSession)
	}
}
