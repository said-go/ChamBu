package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"chambu/server/internal/menu"
)

type Dependencies struct {
	Menu        menu.Repository
	ClientDir   string
	AllowOrigin string
}

func NewRouter(deps Dependencies) http.Handler {
	mux := http.NewServeMux()
	api := apiHandler{menu: deps.Menu, allowOrigin: deps.AllowOrigin}

	mux.HandleFunc("GET /api/health", api.health)
	mux.HandleFunc("GET /api/menu", api.catalog)
	mux.Handle("/", staticHandler(deps.ClientDir))

	return mux
}

type apiHandler struct {
	menu        menu.Repository
	allowOrigin string
}

func (h apiHandler) health(w http.ResponseWriter, _ *http.Request) {
	h.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h apiHandler) catalog(w http.ResponseWriter, _ *http.Request) {
	h.writeJSON(w, http.StatusOK, h.menu.Catalog())
}

func (h apiHandler) writeJSON(w http.ResponseWriter, status int, payload any) {
	if h.allowOrigin != "" {
		w.Header().Set("Access-Control-Allow-Origin", h.allowOrigin)
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func staticHandler(dir string) http.Handler {
	files := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		files.ServeHTTP(w, r)
	})
}
