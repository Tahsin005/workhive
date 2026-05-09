package dto

import "github.com/Tahsin005/workhive-backend/internal/models"

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

func ToAuthResponse(auth *models.AuthResponse) *AuthResponse {
	if auth == nil {
		return nil
	}
	return &AuthResponse{
		Token: auth.Token,
		User:  *ToUserResponse(&auth.User),
	}
}
