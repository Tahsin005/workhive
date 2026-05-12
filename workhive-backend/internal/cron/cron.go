package cron

import (
	"log"
	"net/http"

	"github.com/robfig/cron/v3"
	"github.com/Tahsin005/workhive-backend/internal/config"
)

func InitCron(cfg *config.Config) *cron.Cron {
	c := cron.New()

	// self-ping every 10 minutes to keep the service alive
	_, err := c.AddFunc("*/10 * * * *", func() {
		log.Printf("[Cron] Sending self-ping to health endpoint...")
		
		url := cfg.AppURL + "/api/v1/health"
		resp, err := http.Get(url)
		if err != nil {
			log.Printf("[Cron] Self-ping failed: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			log.Printf("[Cron] Self-ping successful: %d OK", resp.StatusCode)
		} else {
			log.Printf("[Cron] Self-ping returned non-OK status: %d", resp.StatusCode)
		}
	})

	if err != nil {
		log.Fatalf("Error adding cron job: %v", err)
	}

	c.Start()
	log.Println("[Cron] Started successfully")
	return c
}
