package handlers

import (
	"strconv"

	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/services"
	"github.com/Tahsin005/workhive-backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type ReviewHandler struct {
	service  services.ReviewService
	validate *validator.Validate
}

func NewReviewHandler(service services.ReviewService, validate *validator.Validate) *ReviewHandler {
	return &ReviewHandler{service, validate}
}

func (h *ReviewHandler) SubmitReview(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	contractID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid contract ID", nil)
		return
	}

	var input services.SubmitReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	if err := h.validate.Struct(input); err != nil {
		utils.BadRequest(c, "Validation failed", utils.FormatValidationErrors(err))
		return
	}

	review, err := h.service.SubmitReview(userID, contractID, input)
	if err != nil {
		switch err.Error() {
		case "contract not found":
			utils.NotFound(c, "Contract not found")
		case "forbidden":
			utils.Forbidden(c, "You are not a participant of this contract")
		case "contract not completed":
			utils.BadRequest(c, "Reviews can only be submitted for completed contracts", nil)
		case "review already exists":
			utils.Conflict(c, "You have already submitted a review for this contract")
		default:
			utils.InternalError(c, "Failed to submit review")
		}
		return
	}

	utils.Created(c, "Review submitted successfully", dto.ToReviewResponse(*review))
}

func (h *ReviewHandler) GetUserReviews(c *gin.Context) {
	revieweeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	page := 1
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 0 {
		page = p
	}

	limit := 10
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}
	if limit > 50 {
		limit = 50
	}

	result, err := h.service.GetUserReviews(revieweeID, page, limit)
	if err != nil {
		if err.Error() == "user not found" {
			utils.NotFound(c, "User not found")
		} else {
			utils.InternalError(c, "Failed to fetch reviews")
		}
		return
	}

	data := dto.ToUserReviewsResponse(result.Reviews, result.AvgRating, result.TotalReviews)
	utils.PaginatedOK(c, "Reviews fetched successfully", data, result.TotalReviews, page, limit)
}
