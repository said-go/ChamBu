package service

import (
	"errors"

	"chambu/server/internal/models"
	"chambu/server/internal/repository"
	"chambu/server/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	adminRepo repository.AdminRepository
}

func NewAuthService(
	adminRepo repository.AdminRepository,
) *AuthService {

	return &AuthService{
		adminRepo: adminRepo,
	}
}

func (s *AuthService) Login(
	input models.LoginInput,
) (*models.LoginResponse, error) {

	admin, err := s.adminRepo.GetByEmail(input.Email)

	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(admin.PasswordHash),
		[]byte(input.Password),
	)

	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(
		admin.ID,
		admin.Role,
	)

	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token: token,
	}, nil
}
