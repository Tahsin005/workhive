package config

import (
    "log"
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    AppPort  string
    AppEnv   string
    DBHost   string
    DBPort   string
    DBUser   string
    DBPass   string
    DBName   string
    DBSSLMode string
    JWTSecret string
}

func Load() *Config {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, reading from environment")
    }

    return &Config{
        AppPort:   getEnv("APP_PORT", "8080"),
        AppEnv:    getEnv("APP_ENV", "development"),
        DBHost:    getEnv("DB_HOST", "localhost"),
        DBPort:    getEnv("DB_PORT", "5432"),
        DBUser:    getEnv("DB_USER", "workhive"),
        DBPass:    getEnv("DB_PASSWORD", "workhive_secret"),
        DBName:    getEnv("DB_NAME", "workhive"),
        DBSSLMode: getEnv("DB_SSLMODE", "disable"),
        JWTSecret: getEnv("JWT_SECRET", "secret"),
    }
}

func getEnv(key, fallback string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return fallback
}