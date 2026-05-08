package routes

import (
    "github.com/gin-gonic/gin"
    "github.com/Tahsin005/workhive-backend/internal/handlers"
    "gorm.io/gorm"
)

func Setup(r *gin.Engine, db *gorm.DB) {
    healthHandler := handlers.NewHealthHandler(db)

    api := r.Group("/api/v1")
    {
        api.GET("/health", healthHandler.Check)
    }
}