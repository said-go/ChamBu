package service

import (
	"chambu/server/internal/models"
	"chambu/server/internal/repository"
	"errors"

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
	// 1. Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚Р С”Р В° РЎРѓРЎС“РЎвЂ°Р ВµРЎРѓРЎвЂљР Р†Р С•Р Р†Р В°Р Р…Р С‘РЎРЏ email
	existing, err := s.repo.GetByEmail(input.Email)
	if err != nil {
		if !errors.Is(err, repository.ErrNotFound) {
			return nil, err
		}
	}
	if existing != nil {
		return nil, ErrAdminAlreadyExists
	}

	// 2. Р ТђР ВµРЎв‚¬ Р С—Р В°РЎР‚Р С•Р В»РЎРЏ
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 3. Р РЋР С•Р В·Р Т‘Р В°Р Р…Р С‘Р Вµ Р СР С•Р Т‘Р ВµР В»Р С‘
	admin := &models.Admin{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(passwordHash),
		Role:         input.Role,
	}

	// 4. Р РЋР С•РЎвЂ¦РЎР‚Р В°Р Р…Р ВµР Р…Р С‘Р Вµ
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
