package service

import (
	"errors"

	"chambu/server/internal/models"
	"chambu/server/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrAdminAlreadyExists = errors.New("admin already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type AdminService interface {
	Create(input *models.AdminCreate) (*models.Admin, error)
	Get(id uint) (*models.Admin, error)
	List(limit, offset int) ([]models.Admin, error)
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) Create(input *models.AdminCreate) (*models.Admin, error) {
	existing, err := s.repo.GetByEmail(input.Email)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, ErrAdminAlreadyExists
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	admin := &models.Admin{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(passwordHash),
		Role:         input.Role,
	}

	if err := s.repo.Create(admin); err != nil {
		return nil, err
	}

	return admin, nil
}

func (s *adminService) Get(id uint) (*models.Admin, error) {
	admin, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if admin == nil {
		return nil, repository.ErrNotFound
	}

	return admin, nil
}

func (s *adminService) List(limit, offset int) ([]models.Admin, error) {
	return s.repo.List(limit, offset)
}
