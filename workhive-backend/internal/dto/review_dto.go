package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type ReviewResponse struct {
	ID         uuid.UUID  `json:"id"`
	ContractID uuid.UUID  `json:"contract_id"`
	Rating     int8       `json:"rating"`
	Comment    *string    `json:"comment"`
	CreatedAt  time.Time  `json:"created_at"`
	Reviewer   *UserBrief `json:"reviewer"`
	Reviewee   *UserBrief `json:"reviewee,omitempty"`
}

type ReviewStats struct {
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int64   `json:"total_reviews"`
}

type UserReviewsResponse struct {
	Stats   ReviewStats      `json:"stats"`
	Reviews []ReviewResponse `json:"reviews"`
}

func ToReviewResponse(r models.Review) ReviewResponse {
	resp := ReviewResponse{
		ID:         r.ID,
		ContractID: r.ContractID,
		Rating:     r.Rating,
		Comment:    r.Comment,
		CreatedAt:  r.CreatedAt,
	}
	if r.Reviewer.ID != uuid.Nil {
		resp.Reviewer = ToUserBrief(&r.Reviewer)
	}
	if r.Reviewee.ID != uuid.Nil {
		resp.Reviewee = ToUserBrief(&r.Reviewee)
	}
	return resp
}

func ToUserReviewsResponse(reviewsModel []models.Review, avgRating float64, totalReviews int64) UserReviewsResponse {
	reviews := make([]ReviewResponse, len(reviewsModel))
	for i, r := range reviewsModel {
		// When listing a user's reviews, the viewer knows whose profile they're on,
		// so we omit the reviewee from each item.
		resp := ToReviewResponse(r)
		resp.Reviewee = nil
		reviews[i] = resp
	}
	return UserReviewsResponse{
		Stats: ReviewStats{
			AverageRating: avgRating,
			TotalReviews:  totalReviews,
		},
		Reviews: reviews,
	}
}
