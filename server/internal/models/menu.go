package models

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type BrandSettings struct {
	ID          uint           `json:"id" gorm:"primaryKey;default:1"`
	Name        string         `json:"name" gorm:"not null"`
	Subtitle    string         `json:"subtitle"`
	Description string         `json:"description"`
	Phone       string         `json:"phone"`
	Address     string         `json:"address"`
	Hours       string         `json:"hours"`
	Highlights  datatypes.JSON `json:"highlights" gorm:"type:jsonb;default:'[]'"`
}

type MenuCategory struct {
	gorm.Model

	Slug        string `json:"id" gorm:"uniqueIndex;not null"`
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order" gorm:"default:100"`
}

type MenuItem struct {
	gorm.Model

	Slug        string         `json:"id" gorm:"uniqueIndex;not null"`
	CategoryID  string         `json:"categoryId" gorm:"not null;index"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Price       int64          `json:"price" gorm:"not null"`
	Weight      string         `json:"weight"`
	Badges      datatypes.JSON `json:"badges" gorm:"type:jsonb;default:'[]'"`
	Image       string         `json:"image"`
	ImageURL    string         `json:"imageUrl"`
	Available   bool           `json:"available" gorm:"default:true"`
	SortOrder   int            `json:"sort_order" gorm:"default:100"`
}

type MenuItemCreate struct {
	ID          string   `form:"id" json:"id" binding:"required"`
	CategoryID  string   `form:"categoryId" json:"categoryId" binding:"required"`
	Name        string   `form:"name" json:"name" binding:"required"`
	Description string   `form:"description" json:"description"`
	Price       int64    `form:"price" json:"price" binding:"required"`
	Weight      string   `form:"weight" json:"weight"`
	Badges      []string `form:"badges" json:"badges"`
	Image       string   `form:"image" json:"image"`
	Available   *bool    `form:"available" json:"available"`
}

type MenuItemUpdate struct {
	ID          string   `json:"id"`
	CategoryID  string   `json:"categoryId"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       int64    `json:"price"`
	Weight      string   `json:"weight"`
	Badges      []string `json:"badges"`
	Image       string   `json:"image"`
	ImageURL    string   `json:"imageUrl"`
	Available   *bool    `json:"available"`
}

type MenuCategoryInput struct {
	ID          string `json:"id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type MenuFilter struct {
	Category string
	Search   string
}

type Catalog struct {
	Brand      BrandDTO          `json:"brand"`
	Categories []MenuCategoryDTO `json:"categories"`
	Items      []MenuItemDTO     `json:"items"`
}

type BrandDTO struct {
	Name        string   `json:"name"`
	Subtitle    string   `json:"subtitle"`
	Description string   `json:"description"`
	Phone       string   `json:"phone"`
	Address     string   `json:"address"`
	Hours       string   `json:"hours"`
	Highlights  []string `json:"highlights"`
}

type MenuCategoryDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type MenuItemDTO struct {
	ID          string   `json:"id"`
	CategoryID  string   `json:"categoryId"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       int64    `json:"price"`
	Weight      string   `json:"weight"`
	Badges      []string `json:"badges"`
	Image       string   `json:"image"`
	ImageURL    string   `json:"imageUrl,omitempty"`
	Available   bool     `json:"available"`
}
