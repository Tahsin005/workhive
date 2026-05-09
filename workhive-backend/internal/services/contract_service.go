package services

import (
	"errors"
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
)

type ContractService interface {
	ListContracts(filter models.ContractFilter) ([]models.Contract, int64, error)
	GetContractByID(id string, userID uuid.UUID) (*models.Contract, error)
	CompleteContract(id string, clientID uuid.UUID) (*models.Contract, error)
	CancelContract(id string, userID uuid.UUID) (*models.Contract, error)
}

type contractService struct {
	contractRepo repository.ContractRepository
	jobRepo      repository.JobRepository
}

func NewContractService(contractRepo repository.ContractRepository, jobRepo repository.JobRepository) ContractService {
	return &contractService{contractRepo, jobRepo}
}

func (s *contractService) ListContracts(filter models.ContractFilter) ([]models.Contract, int64, error) {
	return s.contractRepo.List(filter)
}

func (s *contractService) GetContractByID(id string, userID uuid.UUID) (*models.Contract, error) {
	contract, err := s.contractRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("contract not found")
	}

	// Check if the user is either the client or the freelancer of the contract
	if contract.ClientID != userID && contract.FreelancerID != userID {
		return nil, errors.New("unauthorized")
	}

	return contract, nil
}

func (s *contractService) CompleteContract(id string, clientID uuid.UUID) (*models.Contract, error) {
	contract, err := s.contractRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("contract not found")
	}

	if contract.ClientID != clientID {
		return nil, errors.New("unauthorized")
	}

	if contract.Status != models.ContractStatusActive {
		return nil, errors.New("contract is not active")
	}

	now := time.Now()
	contract.Status = models.ContractStatusCompleted
	contract.CompletedAt = &now

	if err := s.contractRepo.Update(contract); err != nil {
		return nil, err
	}

	// Update job status
	contract.Job.Status = models.JobStatusCompleted
	if err := s.jobRepo.Update(&contract.Job); err != nil {
		return nil, err
	}

	return contract, nil
}

func (s *contractService) CancelContract(id string, userID uuid.UUID) (*models.Contract, error) {
	contract, err := s.contractRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("contract not found")
	}

	if contract.ClientID != userID && contract.FreelancerID != userID {
		return nil, errors.New("unauthorized")
	}

	if contract.Status != models.ContractStatusActive {
		return nil, errors.New("contract is not active")
	}

	contract.Status = models.ContractStatusCancelled

	if err := s.contractRepo.Update(contract); err != nil {
		return nil, err
	}

	// Update job status
	contract.Job.Status = models.JobStatusCancelled
	if err := s.jobRepo.Update(&contract.Job); err != nil {
		return nil, err
	}

	return contract, nil
}
