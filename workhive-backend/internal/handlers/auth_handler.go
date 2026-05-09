package handlers

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/Tahsin005/workhive-backend/internal/config"
	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService services.AuthService
	cfg         *config.Config
	validate    *validator.Validate
}

func NewAuthHandler(authService services.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
		validate:    validator.New(),
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input models.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}
	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	result, err := h.authService.Register(input)
	if err != nil {
		if err.Error() == "email already in use" {
			utils.Conflict(c, err.Error())
			return
		}
		utils.InternalError(c, "Registration failed")
		return
	}

	secure := h.cfg.AppEnv == "production"
	utils.SetRefreshCookie(c, result.RefreshToken, h.cfg.JWTRefreshDays, secure)
	utils.Created(c, "Registration successful", dto.ToAuthResponse(result))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}
	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	result, err := h.authService.Login(input)
	if err != nil {
		if err.Error() == "invalid credentials" {
			utils.Unauthorized(c, "Invalid email or password")
			return
		}
		if err.Error() == "account is disabled" {
			utils.Forbidden(c, "Your account has been disabled")
			return
		}
		utils.InternalError(c, "Login failed")
		return
	}

	secure := h.cfg.AppEnv == "production"
	utils.SetRefreshCookie(c, result.RefreshToken, h.cfg.JWTRefreshDays, secure)
	utils.OK(c, "Login successful", dto.ToAuthResponse(result))
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")

	user, err := h.authService.GetMe(userID.(uuid.UUID))
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.OK(c, "User fetched successfully", dto.ToUserResponse(user))
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	var input models.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}
	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	user, err := h.authService.UpdateProfile(userID.(uuid.UUID), input)
	if err != nil {
		utils.InternalError(c, "Failed to update profile")
		return
	}

	utils.OK(c, "Profile updated successfully", dto.ToUserResponse(user))
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")

	var input models.ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}
	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	if err := h.authService.ChangePassword(userID.(uuid.UUID), input); err != nil {
		if err.Error() == "current password is incorrect" {
			utils.BadRequest(c, err.Error(), nil)
			return
		}
		if err.Error() == "new password must be different from current password" {
			utils.BadRequest(c, err.Error(), nil)
			return
		}
		utils.InternalError(c, "Failed to change password")
		return
	}

	utils.OK(c, "Password changed successfully", nil)
}

func (h *AuthHandler) DeleteMe(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := h.authService.DeleteMe(userID.(uuid.UUID)); err != nil {
		utils.InternalError(c, "Failed to delete account")
		return
	}

	utils.OK(c, "Account deleted successfully", nil)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		utils.Unauthorized(c, "No refresh token provided")
		return
	}

	response, err := h.authService.Refresh(refreshToken)
	if err != nil {
		secure := h.cfg.AppEnv == "production"
		utils.ClearRefreshCookie(c, secure)
		utils.Unauthorized(c, err.Error())
		return
	}

	secure := h.cfg.AppEnv == "production"
	utils.SetRefreshCookie(c, response.RefreshToken, h.cfg.JWTRefreshDays, secure)
	utils.OK(c, "Token refreshed successfully", dto.ToAuthResponse(response))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	secure := h.cfg.AppEnv == "production"

	refreshToken, _ := c.Cookie("refresh_token")
	if refreshToken != "" {
		// Best-effort DB deletion — don't block logout on failure
		_ = h.authService.Logout(refreshToken)
	}

	utils.ClearRefreshCookie(c, secure)
	utils.OK(c, "Logged out successfully", nil)
}

func (h *AuthHandler) UpdateAvatar(c *gin.Context) {
	userID, _ := c.Get("userID")

	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		utils.BadRequest(c, "No file uploaded", err.Error())
		return
	}

	// validation
	// check extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		utils.BadRequest(c, "Invalid file type", "Only .jpg, .jpeg, .png, and .webp are allowed")
		return
	}

	// check size (2MB)
	if fileHeader.Size > 2*1024*1024 {
		utils.BadRequest(c, "File too large", "Max size allowed is 2MB")
		return
	}

	// get current user (useful if we want to delete old local files)
	user, err := h.authService.GetMe(userID.(uuid.UUID))
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// open file for uploading
	file, err := fileHeader.Open()
	if err != nil {
		utils.InternalError(c, "Failed to open file")
		return
	}
	defer file.Close()

	// upload to cloudinary
	avatarURL, err := utils.UploadToCloudinary(file, h.cfg.CloudinaryURL)
	if err != nil {
		utils.InternalError(c, "Failed to upload to Cloudinary")
		return
	}

	// delete old local avatar if exists (legacy cleanup)
	if user.AvatarURL != nil && *user.AvatarURL != "" {
		oldURL := *user.AvatarURL
		prefix := h.cfg.AppURL + "/uploads/avatars/"
		if strings.HasPrefix(oldURL, prefix) {
			oldFilename := strings.TrimPrefix(oldURL, prefix)
			oldPath := filepath.Join("uploads/avatars", oldFilename)
			_ = os.Remove(oldPath)
		}
	}

	// update database
	updatedUser, err := h.authService.UpdateAvatar(userID.(uuid.UUID), avatarURL)
	if err != nil {
		utils.InternalError(c, "Failed to update database")
		return
	}

	utils.OK(c, "Avatar updated successfully", dto.ToUserResponse(updatedUser))
}