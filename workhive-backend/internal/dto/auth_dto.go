package dto

import "github.com/Tahsin005/workhive-backend/internal/models"

// AuthResponse now includes refresh_token in the body (localStorage-based auth).
type AuthResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

func ToAuthResponse(auth *models.AuthResponse) *AuthResponse {
	if auth == nil {
		return nil
	}
	return &AuthResponse{
		Token:        auth.Token,
		RefreshToken: auth.RefreshToken,
		User:         *ToUserResponse(&auth.User),
	}
}
