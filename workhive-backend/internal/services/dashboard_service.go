package services

import (
	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
)

type DashboardService interface {
	GetClientDashboard(userID uuid.UUID) (*dto.ClientDashboardResponse, error)
	GetFreelancerDashboard(userID uuid.UUID) (*dto.FreelancerDashboardResponse, error)
}

type dashboardService struct {
	jobRepo      repository.JobRepository
	contractRepo repository.ContractRepository
	bidRepo      repository.BidRepository
	paymentRepo  repository.PaymentRepository
}

func NewDashboardService(
	jobRepo repository.JobRepository,
	contractRepo repository.ContractRepository,
	bidRepo repository.BidRepository,
	paymentRepo repository.PaymentRepository,
) DashboardService {
	return &dashboardService{
		jobRepo:      jobRepo,
		contractRepo: contractRepo,
		bidRepo:      bidRepo,
		paymentRepo:  paymentRepo,
	}
}

func (s *dashboardService) GetClientDashboard(userID uuid.UUID) (*dto.ClientDashboardResponse, error) {
	userIDStr := userID.String()

	// 1. Stats
	_, totalJobs, err := s.jobRepo.List(models.JobFilter{ClientID: userIDStr})
	if err != nil {
		return nil, err
	}

	_, activeContracts, err := s.contractRepo.List(models.ContractFilter{
		ClientID: userIDStr,
		Status:   string(models.ContractStatusActive),
	})
	if err != nil {
		return nil, err
	}

	totalSpent, err := s.paymentRepo.SumSpentByUserID(userID)
	if err != nil {
		return nil, err
	}

	// 2. Recent Jobs
	jobs, _, err := s.jobRepo.List(models.JobFilter{
		ClientID: userIDStr,
		Page:     1,
		Limit:    5,
	})
	if err != nil {
		return nil, err
	}

	// 3. Recent Contracts
	contracts, _, err := s.contractRepo.List(models.ContractFilter{
		ClientID: userIDStr,
		Page:     1,
		Limit:    5,
	})
	if err != nil {
		return nil, err
	}

	res := &dto.ClientDashboardResponse{
		RecentJobs:      dto.ToJobResponses(jobs),
		RecentContracts: dto.ToContractResponses(contracts),
	}
	res.Stats.TotalJobs = totalJobs
	res.Stats.ActiveContracts = activeContracts
	res.Stats.TotalSpent = totalSpent

	return res, nil
}

func (s *dashboardService) GetFreelancerDashboard(userID uuid.UUID) (*dto.FreelancerDashboardResponse, error) {
	userIDStr := userID.String()

	// 1. Stats
	_, totalBids, err := s.bidRepo.List(models.BidFilter{FreelancerID: userIDStr})
	if err != nil {
		return nil, err
	}

	_, activeContracts, err := s.contractRepo.List(models.ContractFilter{
		FreelancerID: userIDStr,
		Status:       string(models.ContractStatusActive),
	})
	if err != nil {
		return nil, err
	}

	totalEarnings, err := s.paymentRepo.SumEarningsByUserID(userID)
	if err != nil {
		return nil, err
	}

	// 2. Recent Bids
	bids, _, err := s.bidRepo.List(models.BidFilter{
		FreelancerID: userIDStr,
		Page:         1,
		Limit:        5,
	})
	if err != nil {
		return nil, err
	}

	// 3. Recent Contracts
	contracts, _, err := s.contractRepo.List(models.ContractFilter{
		FreelancerID: userIDStr,
		Page:         1,
		Limit:        5,
	})
	if err != nil {
		return nil, err
	}

	res := &dto.FreelancerDashboardResponse{
		RecentBids:      dto.ToBidResponses(bids),
		RecentContracts: dto.ToContractResponses(contracts),
	}
	res.Stats.TotalBids = totalBids
	res.Stats.ActiveContracts = activeContracts
	res.Stats.TotalEarnings = totalEarnings

	return res, nil
}
