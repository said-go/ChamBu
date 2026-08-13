package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"chambu/server/internal/menu"
)

type Dependencies struct {
	Menu        menu.Repository
	Admin       menu.AdminRepository
	ClientDir   string
	AllowOrigin string
	AdminToken  string
}

func NewRouter(deps Dependencies) http.Handler {
	mux := http.NewServeMux()
	api := apiHandler{
		menu:        deps.Menu,
		admin:       deps.Admin,
		allowOrigin: deps.AllowOrigin,
		adminToken:  deps.AdminToken,
	}

	mux.HandleFunc("GET /api/health", api.health)
	mux.HandleFunc("GET /api/menu", api.catalog)
	mux.HandleFunc("POST /api/admin/categories", api.saveCategory)
	mux.HandleFunc("DELETE /api/admin/categories/{id}", api.deleteCategory)
	mux.HandleFunc("POST /api/admin/items", api.saveItem)
	mux.HandleFunc("DELETE /api/admin/items/{id}", api.deleteItem)
	mux.Handle("/", staticHandler(deps.ClientDir))

	return mux
}

type apiHandler struct {
	menu        menu.Repository
	admin       menu.AdminRepository
	allowOrigin string
	adminToken  string
}

func (h apiHandler) health(w http.ResponseWriter, _ *http.Request) {
	h.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h apiHandler) catalog(w http.ResponseWriter, _ *http.Request) {
	h.writeJSON(w, http.StatusOK, h.menu.Catalog())
}

func (h apiHandler) saveCategory(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(r) {
		h.writeError(w, http.StatusUnauthorized, "invalid admin token")
		return
	}

	var category menu.Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		h.writeError(w, http.StatusBadRequest, "invalid category payload")
		return
	}
	if err := validateCategory(category); err != nil {
		h.writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.admin.UpsertCategory(category); err != nil {
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJSON(w, http.StatusOK, category)
}

func (h apiHandler) deleteCategory(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(r) {
		h.writeError(w, http.StatusUnauthorized, "invalid admin token")
		return
	}
	if err := h.admin.DeleteCategory(r.PathValue("id")); err != nil {
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h apiHandler) saveItem(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(r) {
		h.writeError(w, http.StatusUnauthorized, "invalid admin token")
		return
	}

	var item menu.Item
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		h.writeError(w, http.StatusBadRequest, "invalid item payload")
		return
	}
	if err := validateItem(item); err != nil {
		h.writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.admin.UpsertItem(item); err != nil {
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.writeJSON(w, http.StatusOK, item)
}

func (h apiHandler) deleteItem(w http.ResponseWriter, r *http.Request) {
	if !h.authorized(r) {
		h.writeError(w, http.StatusUnauthorized, "invalid admin token")
		return
	}
	if err := h.admin.DeleteItem(r.PathValue("id")); err != nil {
		h.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h apiHandler) authorized(r *http.Request) bool {
	token := r.Header.Get("X-Admin-Token")
	return h.adminToken != "" && token == h.adminToken
}

func (h apiHandler) writeJSON(w http.ResponseWriter, status int, payload any) {
	if h.allowOrigin != "" {
		w.Header().Set("Access-Control-Allow-Origin", h.allowOrigin)
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (h apiHandler) writeError(w http.ResponseWriter, status int, message string) {
	h.writeJSON(w, status, map[string]string{"error": message})
}

func validateCategory(category menu.Category) error {
	if strings.TrimSpace(category.ID) == "" {
		return errors.New("category id is required")
	}
	if strings.TrimSpace(category.Name) == "" {
		return errors.New("category name is required")
	}
	return nil
}

func validateItem(item menu.Item) error {
	if strings.TrimSpace(item.ID) == "" {
		return errors.New("item id is required")
	}
	if strings.TrimSpace(item.CategoryID) == "" {
		return errors.New("item categoryId is required")
	}
	if strings.TrimSpace(item.Name) == "" {
		return errors.New("item name is required")
	}
	if item.Price < 0 {
		return errors.New("item price must be positive")
	}
	return nil
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
