package config

import (
	"os"
	"time"
)

type Config struct {
	Host         string
	Port         string
	ClientDir    string
	AllowOrigin  string
	DatabaseURL  string
	AdminToken   string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

func FromEnv() Config {
	return Config{
		Host:         env("HOST", ""),
		Port:         env("PORT", "8080"),
		ClientDir:    env("CLIENT_DIR", "../client"),
		AllowOrigin:  env("ALLOW_ORIGIN", "*"),
		DatabaseURL:  env("DATABASE_URL", ""),
		AdminToken:   env("ADMIN_TOKEN", "chambu-admin"),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

func (c Config) Addr() string {
	return c.Host + ":" + c.Port
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
