package services

import (
	"errors"
	"strings"
	"time"

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
	GetUserByID(id uuid.UUID) (*models.User, error)
	Refresh(refreshToken string) (*models.AuthResponse, error)
	Logout(refreshToken string) error
}

type authService struct {
	userRepo         repository.UserRepository
	refreshTokenRepo repository.RefreshTokenRepository
	jwtSecret        string
	jwtAccessHours   int
	jwtRefreshDays   int
}

func NewAuthService(userRepo repository.UserRepository, refreshTokenRepo repository.RefreshTokenRepository, jwtSecret string, jwtAccessHours int, jwtRefreshDays int) AuthService {
	return &authService{userRepo, refreshTokenRepo, jwtSecret, jwtAccessHours, jwtRefreshDays}
}

func (s *authService) Register(input models.RegisterInput) (*models.AuthResponse, error) {
	// normalize email to lowercase
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))

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

	token, err := utils.GenerateToken(user.ID, string(user.Role), s.jwtSecret, time.Duration(s.jwtAccessHours)*time.Hour)
	if err != nil {
		return nil, err
	}

	refreshTokenString, err := utils.GenerateOpaqueToken(32)
	if err != nil {
		return nil, err
	}

	refreshToken := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshTokenString,
		ExpiresAt: time.Now().Add(time.Duration(s.jwtRefreshDays) * 24 * time.Hour),
	}
	if err := s.refreshTokenRepo.Create(&refreshToken); err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, RefreshToken: refreshTokenString, User: *user}, nil
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

	token, err := utils.GenerateToken(user.ID, string(user.Role), s.jwtSecret, time.Duration(s.jwtAccessHours)*time.Hour)
	if err != nil {
		return nil, err
	}

	refreshTokenString, err := utils.GenerateOpaqueToken(32)
	if err != nil {
		return nil, err
	}

	refreshToken := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshTokenString,
		ExpiresAt: time.Now().Add(time.Duration(s.jwtRefreshDays) * 24 * time.Hour),
	}
	if err := s.refreshTokenRepo.Create(&refreshToken); err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, RefreshToken: refreshTokenString, User: *user}, nil
}

func (s *authService) GetMe(id uuid.UUID) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *authService) GetUserByID(id uuid.UUID) (*models.User, error) {
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

func (s *authService) Refresh(refreshTokenStr string) (*models.AuthResponse, error) {
	// Find the old refresh token
	oldToken, err := s.refreshTokenRepo.FindByToken(refreshTokenStr)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Check if expired
	if time.Now().After(oldToken.ExpiresAt) {
		_ = s.refreshTokenRepo.DeleteByToken(refreshTokenStr)
		return nil, errors.New("refresh token expired")
	}

	// Get user to generate new token
	user, err := s.userRepo.FindByID(oldToken.UserID)
	if err != nil {
		return nil, err
	}

	// Generate new access token
	newAccessToken, err := utils.GenerateToken(user.ID, string(user.Role), s.jwtSecret, time.Duration(s.jwtAccessHours)*time.Hour)
	if err != nil {
		return nil, err
	}

	// Generate new refresh token
	newRefreshTokenStr, err := utils.GenerateOpaqueToken(32)
	if err != nil {
		return nil, err
	}

	newRefreshToken := models.RefreshToken{
		UserID:    user.ID,
		Token:     newRefreshTokenStr,
		ExpiresAt: time.Now().Add(time.Duration(s.jwtRefreshDays) * 24 * time.Hour),
	}

	// Token rotation: Save new token, delete old token
	if err := s.refreshTokenRepo.Create(&newRefreshToken); err != nil {
		return nil, err
	}
	_ = s.refreshTokenRepo.DeleteByToken(refreshTokenStr)

	return &models.AuthResponse{
		Token:        newAccessToken,
		RefreshToken: newRefreshTokenStr,
		User:         *user,
	}, nil
}

func (s *authService) Logout(refreshTokenStr string) error {
	// Delete the refresh token to invalidate the session
	return s.refreshTokenRepo.DeleteByToken(refreshTokenStr)
}