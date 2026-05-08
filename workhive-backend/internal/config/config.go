package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort       string
	AppEnv        string
	AppURL        string
	DatabaseURL   string
	CloudinaryURL string
	JWTSecret     string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		AppPort:     getEnv("APP_PORT", "8080"),
		AppEnv:      getEnv("APP_ENV", "development"),
		AppURL:      getEnv("APP_URL", "http://localhost:8080"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		CloudinaryURL: getEnv("CLOUDINARY_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", "secret"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}