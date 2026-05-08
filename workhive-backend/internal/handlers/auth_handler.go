package handlers

import (
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService services.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}

	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", formatValidationErrors(err))
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

	utils.Created(c, "Registration successful", result)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input services.LoginInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Invalid request body", err.Error())
		return
	}

	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", formatValidationErrors(err))
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

	utils.OK(c, "Login successful", result)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")

	user, err := h.authService.GetMe(userID.(uuid.UUID))
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.OK(c, "User fetched successfully", user)
}

// formats validator errors into a readable map
func formatValidationErrors(err error) map[string]string {
	errs := make(map[string]string)
	for _, e := range err.(validator.ValidationErrors) {
		errs[e.Field()] = e.Tag()
	}
	return errs
}