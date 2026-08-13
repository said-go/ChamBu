package main

import (
	"log"
	"net/http"

	"chambu/server/internal/config"
	"chambu/server/internal/httpapi"
	"chambu/server/internal/menu"
)

func main() {
	cfg := config.FromEnv()
	catalog := menu.NewStaticRepository()
	handler := httpapi.NewRouter(httpapi.Dependencies{
		Menu:        catalog,
		ClientDir:   cfg.ClientDir,
		AllowOrigin: cfg.AllowOrigin,
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
