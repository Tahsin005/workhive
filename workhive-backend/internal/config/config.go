package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort             string
	AppEnv              string
	AppURL              string
	DatabaseURL         string
	CloudinaryURL       string
	JWTSecret           string
	JWTAccessHours      int
	JWTRefreshDays      int
	StripeSecret        string
	StripeWebhookSecret string
	AdminSecret         string
}

func Load() *Config {
	if err := godotenv.Overload(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		AppPort:             getEnv("PORT", getEnv("APP_PORT", "8080")),
		AppEnv:              getEnv("APP_ENV", "development"),
		AppURL:              getEnv("APP_URL", "http://localhost:8080"),
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		CloudinaryURL:       getEnv("CLOUDINARY_URL", ""),
		JWTSecret:           getEnv("JWT_SECRET", "secret"),
		JWTAccessHours:      getEnvAsInt("JWT_ACCESS_EXPIRATION_HOURS", 1),
		JWTRefreshDays:      getEnvAsInt("JWT_REFRESH_EXPIRATION_DAYS", 7),
		StripeSecret:        strings.TrimSpace(getEnv("STRIPE_SECRET_KEY", "")),
		StripeWebhookSecret: strings.TrimSpace(getEnv("STRIPE_WEBHOOK_SECRET", "")),
		AdminSecret:         getEnv("ADMIN_SECRET", ""),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if parsed, err := strconv.Atoi(val); err == nil {
			return parsed
		}
	}
	return fallback
}