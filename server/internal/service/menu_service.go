package service

import (
	"encoding/json"
	"errors"
	"mime/multipart"

	"chambu/server/internal/models"
	"chambu/server/internal/repository"
	"chambu/server/internal/storage"

	"gorm.io/datatypes"
)

var ErrMenuItemNotFound = errors.New("menu item not found")

type MenuService interface {
	Catalog() (*models.Catalog, error)
	GetAll(filter models.MenuFilter, page int, limit int) ([]models.MenuItemDTO, int64, error)
	UploadImage(file *multipart.FileHeader) (string, error)
	Create(input *models.MenuItemCreate, imageURL string) (*models.MenuItemDTO, error)
	GetByID(id uint) (*models.MenuItemDTO, error)
	Update(id uint, input *models.MenuItemUpdate) (*models.MenuItemDTO, error)
	Delete(slug string) error
	SaveCategory(input *models.MenuCategoryInput) (*models.MenuCategoryDTO, error)
	DeleteCategory(slug string) error
}

type menuService struct {
	repo    repository.MenuRepository
	storage storage.Storage
}

func NewMenuService(repo repository.MenuRepository, storage storage.Storage) MenuService {
	return &menuService{repo: repo, storage: storage}
}

func (s *menuService) Catalog() (*models.Catalog, error) {
	brand, categories, items, err := s.repo.Catalog()
	if err != nil {
		return nil, err
	}

	return &models.Catalog{
		Brand:      brandDTO(*brand),
		Categories: categoryDTOs(categories),
		Items:      itemDTOs(items),
	}, nil
}

func (s *menuService) GetAll(filter models.MenuFilter, page int, limit int) ([]models.MenuItemDTO, int64, error) {
	offset := (page - 1) * limit
	items, total, err := s.repo.GetAll(filter, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	return itemDTOs(items), total, nil
}

func (s *menuService) UploadImage(file *multipart.FileHeader) (string, error) {
	return s.storage.Upload(file)
}

func (s *menuService) Create(input *models.MenuItemCreate, imageURL string) (*models.MenuItemDTO, error) {
	item := &models.MenuItem{
		Slug:        input.ID,
		CategoryID:  input.CategoryID,
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		Weight:      input.Weight,
		Badges:      jsonArray(input.Badges),
		Image:       input.Image,
		ImageURL:    imageURL,
		Available:   true,
	}
	if input.Available != nil {
		item.Available = *input.Available
	}

	if err := s.repo.UpsertItem(item); err != nil {
		return nil, err
	}
	dto := itemDTO(*item)
	return &dto, nil
}

func (s *menuService) GetByID(id uint) (*models.MenuItemDTO, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrMenuItemNotFound
		}
		return nil, err
	}
	dto := itemDTO(*item)
	return &dto, nil
}

func (s *menuService) Update(id uint, input *models.MenuItemUpdate) (*models.MenuItemDTO, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrMenuItemNotFound
		}
		return nil, err
	}

	if input.ID != "" {
		item.Slug = input.ID
	}
	if input.CategoryID != "" {
		item.CategoryID = input.CategoryID
	}
	if input.Name != "" {
		item.Name = input.Name
	}
	if input.Description != "" {
		item.Description = input.Description
	}
	if input.Price != 0 {
		item.Price = input.Price
	}
	if input.Weight != "" {
		item.Weight = input.Weight
	}
	if input.Badges != nil {
		item.Badges = jsonArray(input.Badges)
	}
	if input.Image != "" {
		item.Image = input.Image
	}
	if input.ImageURL != "" {
		item.ImageURL = input.ImageURL
	}
	if input.Available != nil {
		item.Available = *input.Available
	}

	if err := s.repo.Update(item); err != nil {
		return nil, err
	}
	dto := itemDTO(*item)
	return &dto, nil
}

func (s *menuService) Delete(slug string) error {
	err := s.repo.DeleteItem(slug)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrMenuItemNotFound
	}
	return err
}

func (s *menuService) SaveCategory(input *models.MenuCategoryInput) (*models.MenuCategoryDTO, error) {
	category := &models.MenuCategory{
		Slug:        input.ID,
		Name:        input.Name,
		Description: input.Description,
	}
	if err := s.repo.UpsertCategory(category); err != nil {
		return nil, err
	}
	dto := models.MenuCategoryDTO{ID: category.Slug, Name: category.Name, Description: category.Description}
	return &dto, nil
}

func (s *menuService) DeleteCategory(slug string) error {
	err := s.repo.DeleteCategory(slug)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrMenuItemNotFound
	}
	return err
}

func jsonArray(values []string) datatypes.JSON {
	raw, _ := json.Marshal(values)
	return datatypes.JSON(raw)
}

func brandDTO(brand models.BrandSettings) models.BrandDTO {
	var highlights []string
	_ = json.Unmarshal(brand.Highlights, &highlights)
	return models.BrandDTO{
		Name:        brand.Name,
		Subtitle:    brand.Subtitle,
		Description: brand.Description,
		Phone:       brand.Phone,
		Address:     brand.Address,
		Hours:       brand.Hours,
		Highlights:  highlights,
	}
}

func categoryDTOs(categories []models.MenuCategory) []models.MenuCategoryDTO {
	result := make([]models.MenuCategoryDTO, 0, len(categories))
	for _, category := range categories {
		result = append(result, models.MenuCategoryDTO{
			ID:          category.Slug,
			Name:        category.Name,
			Description: category.Description,
		})
	}
	return result
}

func itemDTOs(items []models.MenuItem) []models.MenuItemDTO {
	result := make([]models.MenuItemDTO, 0, len(items))
	for _, item := range items {
		result = append(result, itemDTO(item))
	}
	return result
}

func itemDTO(item models.MenuItem) models.MenuItemDTO {
	var badges []string
	_ = json.Unmarshal(item.Badges, &badges)
	return models.MenuItemDTO{
		ID:          item.Slug,
		CategoryID:  item.CategoryID,
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		Weight:      item.Weight,
		Badges:      badges,
		Image:       item.Image,
		ImageURL:    item.ImageURL,
		Available:   item.Available,
	}
}
