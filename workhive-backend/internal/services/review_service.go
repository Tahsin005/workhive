package services

import (
	"errors"
	"math"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
)

type SubmitReviewInput struct {
	Rating  int8    `json:"rating" validate:"required,min=1,max=5"`
	Comment *string `json:"comment" validate:"omitempty,max=1000"`
}

type UserReviewsResult struct {
	Reviews      []models.Review
	TotalReviews int64
	AvgRating    float64
}

type ReviewService interface {
	SubmitReview(userID uuid.UUID, contractID uuid.UUID, input SubmitReviewInput) (*models.Review, error)
	GetUserReviews(revieweeID uuid.UUID, page int, limit int) (*UserReviewsResult, error)
}

type reviewService struct {
	reviewRepo   repository.ReviewRepository
	contractRepo repository.ContractRepository
	userRepo     repository.UserRepository
}

func NewReviewService(reviewRepo repository.ReviewRepository, contractRepo repository.ContractRepository, userRepo repository.UserRepository) ReviewService {
	return &reviewService{reviewRepo, contractRepo, userRepo}
}

func (s *reviewService) SubmitReview(userID uuid.UUID, contractID uuid.UUID, input SubmitReviewInput) (*models.Review, error) {
	contract, err := s.contractRepo.GetByID(contractID.String())
	if err != nil {
		return nil, errors.New("contract not found")
	}

	if contract.ClientID != userID && contract.FreelancerID != userID {
		return nil, errors.New("forbidden")
	}

	if contract.Status != models.ContractStatusCompleted {
		return nil, errors.New("contract not completed")
	}

	var revieweeID uuid.UUID
	if contract.ClientID == userID {
		revieweeID = contract.FreelancerID
	} else {
		revieweeID = contract.ClientID
	}

	existingReview, err := s.reviewRepo.FindByContractAndReviewer(contractID, userID)
	if err != nil {
		return nil, err
	}
	if existingReview != nil {
		return nil, errors.New("review already exists")
	}

	review := &models.Review{
		ContractID: contractID,
		ReviewerID: userID,
		RevieweeID: revieweeID,
		Rating:     input.Rating,
		Comment:    input.Comment,
	}

	if err := s.reviewRepo.Create(review); err != nil {
		return nil, err
	}

	return s.reviewRepo.FindByIDWithAssociations(review.ID)
}

func (s *reviewService) GetUserReviews(revieweeID uuid.UUID, page int, limit int) (*UserReviewsResult, error) {
	_, err := s.userRepo.FindByID(revieweeID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	offset := (page - 1) * limit
	reviews, err := s.reviewRepo.FindByRevieweeID(revieweeID, offset, limit)
	if err != nil {
		return nil, err
	}

	total, err := s.reviewRepo.CountByRevieweeID(revieweeID)
	if err != nil {
		return nil, err
	}

	avg, err := s.reviewRepo.AverageRatingByRevieweeID(revieweeID)
	if err != nil {
		return nil, err
	}

	return &UserReviewsResult{
		Reviews:      reviews,
		TotalReviews: total,
		AvgRating:    math.Round(avg*10) / 10,
	}, nil
}
