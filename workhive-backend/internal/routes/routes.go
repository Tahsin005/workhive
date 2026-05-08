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
	bidRepo := repository.NewBidRepository(db)
	contractRepo := repository.NewContractRepository(db)

	// services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	jobService := services.NewJobService(jobRepo, cfg.JWTSecret)
	bidService := services.NewBidService(bidRepo, jobRepo, contractRepo)

	// handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(authService, cfg)
	jobHandler := handlers.NewJobHandler(jobService, cfg)
	bidHandler := handlers.NewBidHandler(bidService)

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

			// protected job routes
			protectedJobs := jobs.Group("/")
			protectedJobs.Use(middleware.AuthRequired(cfg.JWTSecret))
			{
				protectedJobs.GET("/my", middleware.RoleRequired("client"), jobHandler.ListMyJobs)
				protectedJobs.POST("", middleware.RoleRequired("client"), jobHandler.CreateJob)
				protectedJobs.PUT("/:id", middleware.RoleRequired("client"), jobHandler.UpdateJob)
				protectedJobs.DELETE("/:id", middleware.RoleRequired("client"), jobHandler.DeleteJob)

				// see bids on own job (client only)
				protectedJobs.GET("/:id/bids", middleware.RoleRequired("client"), bidHandler.ListJobBids)

				// bid submission route (freelancer only)
				protectedJobs.POST("/:id/bids", middleware.RoleRequired("freelancer"), bidHandler.SubmitBid)
			}

			// public single job detail
			jobs.GET("/:id", jobHandler.GetJob)
		}

		// bid routes (standalone)
		bids := api.Group("/bids")
		bids.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			// my bids (freelancer only)
			bids.GET("/my", middleware.RoleRequired("freelancer"), bidHandler.ListMyBids)

			// edit/withdraw bid routes (freelancer only)
			bids.PUT("/:id", middleware.RoleRequired("freelancer"), bidHandler.UpdateBid)
			bids.PATCH("/:id/withdraw", middleware.RoleRequired("freelancer"), bidHandler.WithdrawBid)

			// accept/reject bid routes (client only)
			bids.PUT("/:id/accept", middleware.RoleRequired("client"), bidHandler.AcceptBid)
			bids.PUT("/:id/reject", middleware.RoleRequired("client"), bidHandler.RejectBid)
		}
	}
}