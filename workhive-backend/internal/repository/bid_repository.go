package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"gorm.io/gorm"
)

type BidRepository interface {
	Create(bid *models.Bid) error
	List(filter models.BidFilter) ([]models.Bid, int64, error)
	GetByID(id string) (*models.Bid, error)
	Update(bid *models.Bid) error
	Delete(id string) error
}

type bidRepository struct {
	db *gorm.DB
}

func NewBidRepository(db *gorm.DB) BidRepository {
	return &bidRepository{db}
}

func (r *bidRepository) Create(bid *models.Bid) error {
	if err := r.db.Create(bid).Error; err != nil {
		return err
	}
	return r.db.Preload("Freelancer").Preload("Job").Preload("Job.Client").First(bid, "id = ?", bid.ID).Error
}

func (r *bidRepository) List(filter models.BidFilter) ([]models.Bid, int64, error) {
	var bids []models.Bid
	var total int64

	query := r.db.Model(&models.Bid{}).Preload("Freelancer").Preload("Job").Preload("Job.Client")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.JobID != "" {
		query = query.Where("job_id = ?", filter.JobID)
	}
	if filter.FreelancerID != "" {
		query = query.Where("freelancer_id = ?", filter.FreelancerID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&bids).Error

	return bids, total, err
}

func (r *bidRepository) GetByID(id string) (*models.Bid, error) {
	var bid models.Bid
	err := r.db.Preload("Freelancer").Preload("Job").Preload("Job.Client").First(&bid, "id = ?", id).Error
	return &bid, err
}

func (r *bidRepository) Update(bid *models.Bid) error {
	return r.db.Save(bid).Error
}

func (r *bidRepository) Delete(id string) error {
	return r.db.Delete(&models.Bid{}, "id = ?", id).Error
}
