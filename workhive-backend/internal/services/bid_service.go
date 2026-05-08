package services

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
)

type BidService interface {
	SubmitBid(jobID uuid.UUID, freelancerID uuid.UUID, input models.SubmitBidInput) (*models.Bid, error)
	ListBids(filter models.BidFilter) ([]models.Bid, int64, error)
	UpdateBid(id string, freelancerID uuid.UUID, input models.UpdateBidInput) (*models.Bid, error)
	WithdrawBid(id string, freelancerID uuid.UUID) error
}

type bidService struct {
	bidRepo repository.BidRepository
	jobRepo repository.JobRepository
}

func NewBidService(bidRepo repository.BidRepository, jobRepo repository.JobRepository) BidService {
	return &bidService{bidRepo, jobRepo}
}

func (s *bidService) SubmitBid(jobID uuid.UUID, freelancerID uuid.UUID, input models.SubmitBidInput) (*models.Bid, error) {
	// check if job exists and is open
	job, err := s.jobRepo.GetByID(jobID.String())
	if err != nil {
		return nil, errors.New("job not found")
	}

	if job.Status != models.JobStatusOpen {
		return nil, errors.New("job is not open for bidding")
	}

	// prevent client from bidding on their own job
	if job.ClientID == freelancerID {
		return nil, errors.New("you cannot bid on your own job")
	}

	bid := models.Bid{
		JobID:        jobID,
		FreelancerID: freelancerID,
		Amount:       input.Amount,
		CoverLetter:  input.CoverLetter,
		Status:       models.BidStatusPending,
	}

	if err := s.bidRepo.Create(&bid); err != nil {
		// Check for unique constraint violation (duplicate bid)
		// Postgres error code for unique_violation is 23505
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("you have already bid on this job")
		}
		return nil, err
	}

	return &bid, nil
}

func (s *bidService) ListBids(filter models.BidFilter) ([]models.Bid, int64, error) {
	return s.bidRepo.List(filter)
}

func (s *bidService) UpdateBid(id string, freelancerID uuid.UUID, input models.UpdateBidInput) (*models.Bid, error) {
	bid, err := s.bidRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("bid not found")
	}

	if bid.FreelancerID != freelancerID {
		return nil, errors.New("unauthorized")
	}

	if bid.Status != models.BidStatusPending {
		return nil, errors.New("cannot update bid that is not pending")
	}

	if input.Amount > 0 {
		bid.Amount = input.Amount
	}
	if input.CoverLetter != "" {
		bid.CoverLetter = input.CoverLetter
	}

	if err := s.bidRepo.Update(bid); err != nil {
		return nil, err
	}

	return bid, nil
}

func (s *bidService) WithdrawBid(id string, freelancerID uuid.UUID) error {
	bid, err := s.bidRepo.GetByID(id)
	if err != nil {
		return errors.New("bid not found")
	}

	if bid.FreelancerID != freelancerID {
		return errors.New("unauthorized")
	}

	if bid.Status != models.BidStatusPending {
		return errors.New("cannot withdraw bid that is not pending")
	}

	bid.Status = models.BidStatusWithdrawn
	return s.bidRepo.Update(bid)
}
