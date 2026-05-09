package services

import (
	"errors"
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
)

type BidService interface {
	SubmitBid(jobID uuid.UUID, freelancerID uuid.UUID, input models.SubmitBidInput) (*models.Bid, error)
	ListBids(filter models.BidFilter) ([]models.Bid, int64, error)
	ListJobBids(jobID uuid.UUID, clientID uuid.UUID, filter models.BidFilter) ([]models.Bid, int64, error)
	UpdateBid(id string, freelancerID uuid.UUID, input models.UpdateBidInput) (*models.Bid, error)
	WithdrawBid(id string, freelancerID uuid.UUID) error
	AcceptBid(id string, clientID uuid.UUID) (*models.Bid, error)
	RejectBid(id string, clientID uuid.UUID) (*models.Bid, error)
}

type bidService struct {
	bidRepo      repository.BidRepository
	jobRepo      repository.JobRepository
	contractRepo repository.ContractRepository
}

func NewBidService(bidRepo repository.BidRepository, jobRepo repository.JobRepository, contractRepo repository.ContractRepository) BidService {
	return &bidService{bidRepo, jobRepo, contractRepo}
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

	// check if freelancer already has an active (pending/accepted) bid
	hasActive, err := s.bidRepo.HasActiveBid(jobID.String(), freelancerID.String())
	if err != nil {
		return nil, err
	}
	if hasActive {
		return nil, errors.New("you have already bid on this job")
	}

	bid := models.Bid{
		JobID:        jobID,
		FreelancerID: freelancerID,
		Amount:       input.Amount,
		CoverLetter:  input.CoverLetter,
		Status:       models.BidStatusPending,
	}

	if err := s.bidRepo.Create(&bid); err != nil {
		return nil, err
	}

	return &bid, nil
}

func (s *bidService) ListBids(filter models.BidFilter) ([]models.Bid, int64, error) {
	return s.bidRepo.List(filter)
}

func (s *bidService) ListJobBids(jobID uuid.UUID, clientID uuid.UUID, filter models.BidFilter) ([]models.Bid, int64, error) {
	// check if job exists and belongs to client
	job, err := s.jobRepo.GetByID(jobID.String())
	if err != nil {
		return nil, 0, errors.New("job not found")
	}

	if job.ClientID != clientID {
		return nil, 0, errors.New("unauthorized")
	}

	filter.JobID = jobID.String()
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

func (s *bidService) AcceptBid(id string, clientID uuid.UUID) (*models.Bid, error) {
	bid, err := s.bidRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("bid not found")
	}

	// check if the job belongs to the client
	if bid.Job.ClientID != clientID {
		return nil, errors.New("unauthorized")
	}

	if bid.Status != models.BidStatusPending {
		return nil, errors.New("bid is not pending")
	}

	if bid.Job.Status != models.JobStatusOpen {
		return nil, errors.New("job is not open")
	}

	// accept this bid
	bid.Status = models.BidStatusAccepted
	if err := s.bidRepo.Update(bid); err != nil {
		return nil, err
	}

	// auto-reject all other pending bids on the same job
	if err := s.bidRepo.RejectOtherBids(bid.JobID.String(), bid.ID.String()); err != nil {
		return nil, err
	}

	// update job status
	bid.Job.Status = models.JobStatusInProgress
	if err := s.jobRepo.Update(&bid.Job); err != nil {
		return nil, err
	}

	// create contract
	contract := models.Contract{
		JobID:        bid.JobID,
		BidID:        bid.ID,
		ClientID:     clientID,
		FreelancerID: bid.FreelancerID,
		Amount:       bid.Amount,
		Status:       models.ContractStatusActive,
		StartedAt:    time.Now(),
	}

	if err := s.contractRepo.Create(&contract); err != nil {
		return nil, err
	}

	return bid, nil
}


func (s *bidService) RejectBid(id string, clientID uuid.UUID) (*models.Bid, error) {
	bid, err := s.bidRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("bid not found")
	}

	// check if the job belongs to the client
	if bid.Job.ClientID != clientID {
		return nil, errors.New("unauthorized")
	}

	if bid.Status != models.BidStatusPending {
		return nil, errors.New("bid is not pending")
	}

	bid.Status = models.BidStatusRejected
	if err := s.bidRepo.Update(bid); err != nil {
		return nil, err
	}

	return bid, nil
}
