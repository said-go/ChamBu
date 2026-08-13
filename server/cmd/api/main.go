package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"chambu/server/internal/config"
	"chambu/server/internal/httpapi"
	"chambu/server/internal/menu"
	"chambu/server/internal/platform/postgres"
)

func main() {
	cfg := config.FromEnv()

	var catalog menu.AdminRepository = menu.NewStaticRepository()
	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		db, err := postgres.Open(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("connect postgres: %v", err)
		}
		defer db.Close()
		catalog = menu.NewPostgresRepository(db)
		log.Print("ChamBu menu repository: postgres")
	} else {
		log.Print("ChamBu menu repository: static fallback")
	}

	handler := httpapi.NewRouter(httpapi.Dependencies{
		Menu:        catalog,
		Admin:       catalog,
		ClientDir:   cfg.ClientDir,
		AllowOrigin: cfg.AllowOrigin,
		AdminToken:  cfg.AdminToken,
	})

	server := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      handler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	log.Printf("ChamBu API listening on http://localhost%s", cfg.Addr())
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server stopped: %v", err)
	}
}
