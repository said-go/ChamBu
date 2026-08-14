package repository

import (
	"chambu/server/internal/models"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrNotFound = errors.New("record not found")
)

type AdminRepository interface {
	Create(admin *models.Admin) error
	GetByID(id uint) (*models.Admin, error)
	GetByEmail(email string) (*models.Admin, error)
	List(limit, offset int) ([]models.Admin, error)
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) Create(admin *models.Admin) error {
	return r.db.Create(admin).Error
}

func (r *adminRepository) GetByID(id uint) (*models.Admin, error) {
	var admin models.Admin

	err := r.db.First(&admin, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &admin, nil
}

func (r *adminRepository) GetByEmail(email string) (*models.Admin, error) {
	var admin models.Admin

	err := r.db.Where("email = ?", email).First(&admin).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &admin, nil
}

func (r *adminRepository) List(limit, offset int) ([]models.Admin, error) {
	var admins []models.Admin

	err := r.db.
		Limit(limit).
		Offset(offset).
		Find(&admins).Error

	if err != nil {
		return nil, err
	}

	return admins, nil
}
