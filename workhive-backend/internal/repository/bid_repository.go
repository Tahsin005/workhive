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
	RejectOtherBids(jobID string, acceptedBidID string) error
	HasAcceptedBid(jobID string) (bool, error)
	HasActiveBid(jobID string, freelancerID string) (bool, error)
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

// RejectOtherBids sets all non-accepted bids for a job to 'rejected', used atomically when accepting one bid.
func (r *bidRepository) RejectOtherBids(jobID string, acceptedBidID string) error {
	return r.db.Model(&models.Bid{}).
		Where("job_id = ? AND id != ? AND status = ?", jobID, acceptedBidID, models.BidStatusPending).
		Update("status", models.BidStatusRejected).Error
}

// HasAcceptedBid returns true if a job has any bid in accepted status.
func (r *bidRepository) HasAcceptedBid(jobID string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Bid{}).Where("job_id = ? AND status = ?", jobID, models.BidStatusAccepted).Count(&count).Error
	return count > 0, err
}

// HasActiveBid returns true if a freelancer has a pending or accepted bid for a job.
func (r *bidRepository) HasActiveBid(jobID string, freelancerID string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Bid{}).Where("job_id = ? AND freelancer_id = ? AND status IN ?", jobID, freelancerID, []models.BidStatus{models.BidStatusPending, models.BidStatusAccepted}).Count(&count).Error
	return count > 0, err
}
