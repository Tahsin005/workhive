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
	jobRepo := repository.NewJobRepository(db)

	// services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	jobService := services.NewJobService(jobRepo, cfg.JWTSecret)

	// handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(authService, cfg)
	jobHandler := handlers.NewJobHandler(jobService, cfg)

	r.Static("/uploads", "./uploads")

	api := r.Group("/api/v1")
	{
		// health check
		api.GET("/health", healthHandler.Check)

		// auth routes
		auth := api.Group("/auth")
		{
			// public auth routes
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)

			// protected auth routes
			protectedAuth := auth.Group("/")
			protectedAuth.Use(middleware.AuthRequired(cfg.JWTSecret))
			{
				protectedAuth.GET("/me", authHandler.Me)
				protectedAuth.PUT("/me", authHandler.UpdateProfile)
				protectedAuth.PUT("/me/avatar", authHandler.UpdateAvatar)
				protectedAuth.PUT("/me/password", authHandler.ChangePassword)
				protectedAuth.DELETE("/me", authHandler.DeleteMe)
			}
		}

		// job routes
		jobs := api.Group("/jobs")
		{
			// public job routes
			jobs.GET("", jobHandler.ListJobs)
			jobs.GET("/:id", jobHandler.GetJob)

			// protected job routes
			protectedJobs := jobs.Group("/")
			protectedJobs.Use(middleware.AuthRequired(cfg.JWTSecret))
			{
				protectedJobs.POST("", middleware.RoleRequired("client"), jobHandler.CreateJob)
			}
		}
	}
}