package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/Tahsin005/workhive-backend/internal/config"
	"github.com/Tahsin005/workhive-backend/internal/handlers"
	"github.com/Tahsin005/workhive-backend/internal/middleware"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// repositories
	userRepo := repository.NewUserRepository(db)

	// services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)

	// handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(authService, cfg)

	r.Static("/uploads", "./uploads")

	api := r.Group("/api/v1")
	{
		// public
		api.GET("/health", healthHandler.Check)
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)

		protected := api.Group("/")
		protected.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			protected.GET("/auth/me", authHandler.Me)
			protected.PUT("/auth/me", authHandler.UpdateProfile)
			protected.PUT("/auth/me/avatar", authHandler.UpdateAvatar)
			protected.PUT("/auth/me/password", authHandler.ChangePassword)
			protected.DELETE("/auth/me", authHandler.DeleteMe)
		}
	}
}