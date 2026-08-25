package transport

import (
	"mime/multipart"
	"net/textproto"
	"strings"
	"testing"

	"chambu/server/internal/models"
)

func TestValidateMenuCreate(t *testing.T) {
	valid := &models.MenuItemCreate{
		Name:       " Блин с медом ",
		CategoryID: " pancakes ",
		Price:      190,
	}

	if err := validateMenuCreate(valid); err != nil {
		t.Fatalf("validateMenuCreate(valid) returned error: %v", err)
	}
	if valid.Name != "Блин с медом" || valid.CategoryID != "pancakes" {
		t.Fatalf("validateMenuCreate() did not trim fields: %+v", valid)
	}

	tests := []struct {
		name  string
		input *models.MenuItemCreate
		want  string
	}{
		{"empty name", &models.MenuItemCreate{CategoryID: "pancakes", Price: 190}, "название"},
		{"empty category", &models.MenuItemCreate{Name: "Блин", Price: 190}, "категорию"},
		{"invalid price", &models.MenuItemCreate{Name: "Блин", CategoryID: "pancakes"}, "цена"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateMenuCreate(tt.input)
			if err == nil || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("validateMenuCreate() error = %v, want contains %q", err, tt.want)
			}
		})
	}
}

func TestValidateImageUpload(t *testing.T) {
	validHeader := textproto.MIMEHeader{}
	validHeader.Set("Content-Type", "image/jpeg")
	if err := validateImageUpload(&multipart.FileHeader{Filename: "dish.jpg", Header: validHeader, Size: 1024}); err != nil {
		t.Fatalf("validateImageUpload(valid) returned error: %v", err)
	}

	badTypeHeader := textproto.MIMEHeader{}
	badTypeHeader.Set("Content-Type", "text/plain")
	if err := validateImageUpload(&multipart.FileHeader{Filename: "dish.txt", Header: badTypeHeader, Size: 1024}); err == nil {
		t.Fatal("validateImageUpload() accepted unsupported content type")
	}

	if err := validateImageUpload(&multipart.FileHeader{Filename: "big.jpg", Header: validHeader, Size: 9 * 1024 * 1024}); err == nil {
		t.Fatal("validateImageUpload() accepted oversized file")
	}
}
