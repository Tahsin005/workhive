package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type UserBrief struct {
	ID        uuid.UUID   `json:"id"`
	FullName  string      `json:"full_name"`
	AvatarURL *string     `json:"avatar_url"`
	Role      models.Role `json:"role"`
}

type UserResponse struct {
	ID        uuid.UUID   `json:"id"`
	FullName  string      `json:"full_name"`
	Email     string      `json:"email"`
	Role      models.Role `json:"role"`
	AvatarURL *string     `json:"avatar_url,omitempty"`
	Bio       *string     `json:"bio,omitempty"`
	IsActive  bool        `json:"is_active"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

func ToUserBrief(user *models.User) *UserBrief {
	if user == nil {
		return nil
	}
	return &UserBrief{
		ID:        user.ID,
		FullName:  user.FullName,
		AvatarURL: user.AvatarURL,
		Role:      user.Role,
	}
}

func ToUserResponse(user *models.User) *UserResponse {
	if user == nil {
		return nil
	}
	return &UserResponse{
		ID:        user.ID,
		FullName:  user.FullName,
		Email:     user.Email,
		Role:      user.Role,
		AvatarURL: user.AvatarURL,
		Bio:       user.Bio,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}

func ToUserResponses(users []models.User) []*UserResponse {
	responses := make([]*UserResponse, len(users))
	for i, user := range users {
		responses[i] = ToUserResponse(&user)
	}
	return responses
}
