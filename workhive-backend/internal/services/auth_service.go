package services

import (
	"errors"
	"strings"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(input models.RegisterInput) (*models.AuthResponse, error)
	Login(input models.LoginInput) (*models.AuthResponse, error)
	GetMe(id uuid.UUID) (*models.User, error)
	UpdateProfile(id uuid.UUID, input models.UpdateProfileInput) (*models.User, error)
	UpdateAvatar(id uuid.UUID, avatarURL string) (*models.User, error)
	ChangePassword(id uuid.UUID, input models.ChangePasswordInput) error
	DeleteMe(id uuid.UUID) error
}

type authService struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) AuthService {
	return &authService{userRepo, jwtSecret}
}

func (s *authService) Register(input models.RegisterInput) (*models.AuthResponse, error) {
	// check if email already exists
	existing, err := s.userRepo.FindByEmail(input.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already in use")
	}

	// hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	parts := strings.Split(input.Email, "@")
	fullName := parts[0]

	user := &models.User{
		FullName: fullName,
		Email:    input.Email,
		Password: string(hashed),
		Role:     input.Role,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role), s.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

func (s *authService) Login(input models.LoginInput) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, errors.New("account is disabled")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role), s.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

func (s *authService) GetMe(id uuid.UUID) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *authService) UpdateProfile(id uuid.UUID, input models.UpdateProfileInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.Bio != nil {
		user.Bio = input.Bio
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) UpdateAvatar(id uuid.UUID, avatarURL string) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	user.AvatarURL = &avatarURL

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}


func (s *authService) ChangePassword(id uuid.UUID, input models.ChangePasswordInput) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	if input.CurrentPassword == input.NewPassword {
		return errors.New("new password must be different from current password")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashed)
	return s.userRepo.Update(user)
}

func (s *authService) DeleteMe(id uuid.UUID) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}

	return s.userRepo.Delete(user)
}