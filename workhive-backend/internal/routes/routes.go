package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/Tahsin005/workhive-backend/internal/config"
	"github.com/Tahsin005/workhive-backend/internal/handlers"
	"github.com/Tahsin005/workhive-backend/internal/middleware"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/Tahsin005/workhive-backend/internal/services"
	ws "github.com/Tahsin005/workhive-backend/internal/websocket"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, db *gorm.DB, cfg *config.Config, hub *ws.Hub) {
	// repositories
	userRepo := repository.NewUserRepository(db)
	jobRepo := repository.NewJobRepository(db)
	bidRepo := repository.NewBidRepository(db)
	contractRepo := repository.NewContractRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	adminRepo := repository.NewAdminRepository(db)

	// services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	jobService := services.NewJobService(jobRepo, bidRepo, contractRepo, cfg.JWTSecret)
	bidService := services.NewBidService(bidRepo, jobRepo, contractRepo)
	contractService := services.NewContractService(contractRepo, jobRepo)
	paymentService := services.NewPaymentService(paymentRepo, contractRepo, jobRepo, cfg)
	messageService := services.NewMessageService(messageRepo, contractRepo)
	reviewService := services.NewReviewService(reviewRepo, contractRepo, userRepo)
	adminService := services.NewAdminService(adminRepo, userRepo, jobRepo)

	// handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(authService, cfg)
	jobHandler := handlers.NewJobHandler(jobService, cfg)
	bidHandler := handlers.NewBidHandler(bidService)
	contractHandler := handlers.NewContractHandler(contractService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	messageHandler := handlers.NewMessageHandler(messageService, hub, cfg.JWTSecret)
	reviewHandler := handlers.NewReviewHandler(reviewService, validator.New())
	adminHandler := handlers.NewAdminHandler(adminService, validator.New(), cfg.AdminSecret)

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

		// contract routes
		contracts := api.Group("/contracts")
		contracts.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			// routes for both client and freelancer
			both := contracts.Group("/")
			both.Use(middleware.RoleRequired("client", "freelancer"))
			{
				both.GET("", contractHandler.ListMyContracts)
				both.GET("/:id", contractHandler.GetContract)
				both.PUT("/:id/cancel", contractHandler.CancelContract)
			}

			// routes for client only
			clientOnly := contracts.Group("/")
			clientOnly.Use(middleware.RoleRequired("client"))
			{
				clientOnly.PUT("/:id/complete", contractHandler.CompleteContract)
			}
		}

		// payment routes
		payments := api.Group("/payments")
		{
			// public webhook
			payments.POST("/webhook", paymentHandler.HandleWebhook)

			// protected payment routes
			protectedPayments := payments.Group("/")
			protectedPayments.Use(middleware.AuthRequired(cfg.JWTSecret))
			{
				// any authenticated user can view their contract payments
				protectedPayments.GET("/contract/:id", paymentHandler.GetByContractID)

				// client only routes
				clientPayments := protectedPayments.Group("/")
				clientPayments.Use(middleware.RoleRequired("client"))
				{
					clientPayments.POST("/intent", paymentHandler.CreateIntent)
				}
			}
		}

		// message routes
		messages := api.Group("/messages")
		messages.Use(middleware.AuthRequired(cfg.JWTSecret))
		messages.Use(middleware.RoleRequired("client", "freelancer"))
		{
			messages.GET("/:contractId", messageHandler.GetHistory)
			messages.POST("/:contractId", messageHandler.SendMessage)
			messages.PUT("/:contractId/read", messageHandler.MarkAsRead)
		}

		// WebSocket — auth via query param
		api.GET("/ws/chat/:contractId", messageHandler.HandleWebSocket)

		// review routes
		reviews := api.Group("/reviews")
		{
			// public
			reviews.GET("/user/:id", reviewHandler.GetUserReviews)

			// protected
			protectedReviews := reviews.Group("/")
			protectedReviews.Use(middleware.AuthRequired(cfg.JWTSecret))
			{
				protectedReviews.POST("/contract/:id", reviewHandler.SubmitReview)
			}
		}

		// admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(cfg.JWTSecret))
		admin.Use(middleware.RoleRequired("admin"))
		{
			admin.GET("/users", adminHandler.ListUsers)
			admin.GET("/users/:id", adminHandler.GetUser)
			admin.PUT("/users/:id/ban", adminHandler.BanUser)
			admin.DELETE("/users/:id", adminHandler.DeleteUser)
			admin.GET("/jobs", adminHandler.ListJobs)
			admin.DELETE("/jobs/:id", adminHandler.DeleteJob)
			admin.GET("/stats", adminHandler.GetStats)
		}

		// public promotion route — secret word acts as the auth mechanism
		api.POST("/promote/:email/:secret", adminHandler.PromoteToAdmin)
	}
}