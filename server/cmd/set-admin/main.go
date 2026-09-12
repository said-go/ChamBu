package main

import (
	"errors"
	"log"
	"os"
	"strings"

	"chambu/server/internal/config"
	"chambu/server/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	cfg := config.FromEnv()
	login := strings.TrimSpace(os.Getenv("ADMIN_LOGIN"))
	password := os.Getenv("ADMIN_PASSWORD")
	previous := strings.TrimSpace(os.Getenv("ADMIN_PREVIOUS_LOGIN"))
	if login == "" || password == "" || previous == "" {
		log.Fatal("ADMIN_LOGIN, ADMIN_PASSWORD and ADMIN_PREVIOUS_LOGIN are required")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	db, err := config.TryOpenDatabase(cfg)
	if err != nil {
		log.Fatal(err)
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		var admin models.Admin
		if err := tx.Where("email = ?", previous).First(&admin).Error; err != nil {
			return err
		}
		result := tx.Model(&admin).Updates(map[string]interface{}{
			"email": login, "password_hash": string(hash),
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return errors.New("expected one admin to be updated")
		}
		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
	log.Print("Admin credentials updated")
}
