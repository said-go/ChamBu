package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Config struct {
	Host        string
	Port        string
	ClientDir   string
	DatabaseURL string
	DBUser      string
	DBPass      string
	DBHost      string
	DBName      string
	DBPort      string
	Storage     string
	CloudName   string
	CloudKey    string
	CloudSecret string
	YandexToken string
}

func FromEnv() Config {
	_ = godotenv.Load(".env")
	return Config{
		Host:        env("HOST", ""),
		Port:        env("PORT", "8080"),
		ClientDir:   env("CLIENT_DIR", "../client"),
		DatabaseURL: env("DATABASE_URL", ""),
		DBUser:      env("DB_USER", "postgres"),
		DBPass:      env("DB_PASS", "postgres"),
		DBHost:      env("DB_HOST", "localhost"),
		DBName:      env("DB_NAME", "chambu"),
		DBPort:      env("DB_PORT", "5432"),
		Storage:     env("STORAGE_DRIVER", "yandex"),
		CloudName:   env("CLOUDINARY_CLOUD_NAME", ""),
		CloudKey:    env("CLOUDINARY_API_KEY", ""),
		CloudSecret: env("CLOUDINARY_API_SECRET", ""),
		YandexToken: env("YANDEX_DISK_TOKEN", ""),
	}
}

func (c Config) Addr() string {
	return c.Host + ":" + c.Port
}

func SetUpDatabaseConnection() *gorm.DB {
	cfg := FromEnv()
	return OpenDatabase(cfg)
}

func OpenDatabase(cfg Config) *gorm.DB {
	dsn := cfg.DatabaseURL
	if dsn == "" {
		dsn = fmt.Sprintf("host=%v user=%v password=%v dbname=%v port=%v sslmode=disable", cfg.DBHost, cfg.DBUser, cfg.DBPass, cfg.DBName, cfg.DBPort)
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})

	if err != nil {
		panic(err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		panic(err)
	}
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return db
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
