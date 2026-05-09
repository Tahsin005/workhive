package repository

import (
	"errors"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewRepository interface {
	Create(review *models.Review) error
	FindByContractAndReviewer(contractID uuid.UUID, reviewerID uuid.UUID) (*models.Review, error)
	FindByRevieweeID(revieweeID uuid.UUID, offset int, limit int) ([]models.Review, error)
	CountByRevieweeID(revieweeID uuid.UUID) (int64, error)
	AverageRatingByRevieweeID(revieweeID uuid.UUID) (float64, error)
	FindByIDWithAssociations(id uuid.UUID) (*models.Review, error)
}

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db}
}

func (r *reviewRepository) Create(review *models.Review) error {
	return r.db.Create(review).Error
}

func (r *reviewRepository) FindByContractAndReviewer(contractID uuid.UUID, reviewerID uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.Where("contract_id = ? AND reviewer_id = ?", contractID, reviewerID).First(&review).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil if not found to easily check existence
		}
		return nil, err
	}
	return &review, nil
}

func (r *reviewRepository) FindByRevieweeID(revieweeID uuid.UUID, offset int, limit int) ([]models.Review, error) {
	var reviews []models.Review
	err := r.db.Where("reviewee_id = ?", revieweeID).
		Preload("Reviewer").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) CountByRevieweeID(revieweeID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Review{}).Where("reviewee_id = ?", revieweeID).Count(&count).Error
	return count, err
}

func (r *reviewRepository) AverageRatingByRevieweeID(revieweeID uuid.UUID) (float64, error) {
	var avg float64
	err := r.db.Model(&models.Review{}).Where("reviewee_id = ?", revieweeID).Select("COALESCE(AVG(rating), 0)").Scan(&avg).Error
	return avg, err
}

func (r *reviewRepository) FindByIDWithAssociations(id uuid.UUID) (*models.Review, error) {
	var review models.Review
	err := r.db.Preload("Reviewer").Preload("Reviewee").First(&review, "id = ?", id).Error
	return &review, err
}
