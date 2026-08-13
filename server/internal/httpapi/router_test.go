package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chambu/server/internal/menu"
)

func TestMenuEndpoint(t *testing.T) {
	router := NewRouter(Dependencies{Menu: menu.NewStaticRepository(), AllowOrigin: "*"})

	req := httptest.NewRequest(http.MethodGet, "/api/menu", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var catalog menu.Catalog
	if err := json.NewDecoder(rec.Body).Decode(&catalog); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if catalog.Brand.Name != "ЧамБу" {
		t.Fatalf("unexpected brand name %q", catalog.Brand.Name)
	}
	if len(catalog.Categories) == 0 || len(catalog.Items) == 0 {
		t.Fatal("expected menu categories and items")
	}
}
