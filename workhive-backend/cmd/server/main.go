package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/Tahsin005/workhive-backend/internal/config"
	"github.com/Tahsin005/workhive-backend/internal/routes"
	"github.com/Tahsin005/workhive-backend/internal/websocket"
)

func main() {
	cfg := config.Load()
	db := config.ConnectDB(cfg)

	hub := websocket.NewHub()
	go hub.Run()

	r := gin.Default()
	routes.Setup(r, db, cfg, hub)

	log.Printf("Server starting on port %s", cfg.AppPort)
	if err := r.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}