package repository

import (
	"errors"
	"strings"

	"chambu/server/internal/models"

	"gorm.io/gorm"
)

type MenuRepository interface {
	Catalog() (*models.BrandSettings, []models.MenuCategory, []models.MenuItem, error)
	GetAll(filter models.MenuFilter, limit int, offset int) ([]models.MenuItem, int64, error)
	GetByID(id uint) (*models.MenuItem, error)
	GetBySlug(slug string) (*models.MenuItem, error)
	Create(item *models.MenuItem) error
	Update(item *models.MenuItem) error
	Delete(id uint) error
	UpsertItem(item *models.MenuItem) error
	DeleteItem(slug string) error
	UpsertCategory(category *models.MenuCategory) error
	DeleteCategory(slug string) error
}

type menuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) MenuRepository {
	return &menuRepository{db: db}
}

func (r *menuRepository) Catalog() (*models.BrandSettings, []models.MenuCategory, []models.MenuItem, error) {
	var brand models.BrandSettings
	if err := r.db.FirstOrCreate(&brand, models.BrandSettings{ID: 1}).Error; err != nil {
		return nil, nil, nil, err
	}

	var categories []models.MenuCategory
	if err := r.db.Order("sort_order asc, name asc").Find(&categories).Error; err != nil {
		return nil, nil, nil, err
	}

	var items []models.MenuItem
	if err := r.db.Order("sort_order asc, name asc").Find(&items).Error; err != nil {
		return nil, nil, nil, err
	}

	return &brand, categories, items, nil
}

func (r *menuRepository) GetAll(filter models.MenuFilter, limit int, offset int) ([]models.MenuItem, int64, error) {
	var items []models.MenuItem
	query := r.db.Model(&models.MenuItem{})

	if filter.Category != "" {
		query = query.Where("category_id = ?", filter.Category)
	}

	if filter.Search != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(filter.Search)+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("sort_order asc, name asc").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *menuRepository) GetByID(id uint) (*models.MenuItem, error) {
	var item models.MenuItem
	err := r.db.First(&item, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (r *menuRepository) GetBySlug(slug string) (*models.MenuItem, error) {
	var item models.MenuItem
	err := r.db.Where("slug = ?", slug).First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (r *menuRepository) Create(item *models.MenuItem) error {
	return r.db.Create(item).Error
}

func (r *menuRepository) Update(item *models.MenuItem) error {
	return r.db.Save(item).Error
}

func (r *menuRepository) Delete(id uint) error {
	result := r.db.Delete(&models.MenuItem{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *menuRepository) UpsertItem(item *models.MenuItem) error {
	var existing models.MenuItem
	err := r.db.Where("slug = ?", item.Slug).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(item).Error
	}
	if err != nil {
		return err
	}

	existing.CategoryID = item.CategoryID
	existing.Name = item.Name
	existing.Description = item.Description
	existing.Price = item.Price
	existing.Weight = item.Weight
	existing.Badges = item.Badges
	existing.Image = item.Image
	if item.ImageURL != "" {
		existing.ImageURL = item.ImageURL
	}
	existing.Available = item.Available
	existing.SortOrder = item.SortOrder
	return r.db.Save(&existing).Error
}

func (r *menuRepository) DeleteItem(slug string) error {
	result := r.db.Where("slug = ?", slug).Delete(&models.MenuItem{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *menuRepository) UpsertCategory(category *models.MenuCategory) error {
	var existing models.MenuCategory
	err := r.db.Where("slug = ?", category.Slug).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(category).Error
	}
	if err != nil {
		return err
	}

	existing.Name = category.Name
	existing.Description = category.Description
	return r.db.Save(&existing).Error
}

func (r *menuRepository) DeleteCategory(slug string) error {
	result := r.db.Where("slug = ?", slug).Delete(&models.MenuCategory{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}
