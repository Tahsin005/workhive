package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type ContractBrief struct {
	ID        uuid.UUID             `json:"id"`
	Amount    float64               `json:"amount"`
	Status    models.ContractStatus `json:"status"`
	StartedAt time.Time             `json:"started_at"`
}

type ContractResponse struct {
	ID          uuid.UUID             `json:"id"`
	Amount      float64               `json:"amount"`
	Status      models.ContractStatus `json:"status"`
	StartedAt   time.Time             `json:"started_at"`
	CompletedAt *time.Time            `json:"completed_at,omitempty"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
	Job         *JobBrief             `json:"job,omitempty"`
	Bid         *BidBrief             `json:"bid,omitempty"`
	Client      *UserBrief            `json:"client,omitempty"`
	Freelancer  *UserBrief            `json:"freelancer,omitempty"`
}

func ToContractBrief(contract *models.Contract) *ContractBrief {
	if contract == nil {
		return nil
	}
	return &ContractBrief{
		ID:        contract.ID,
		Amount:    contract.Amount,
		Status:    contract.Status,
		StartedAt: contract.StartedAt,
	}
}

func ToContractResponse(contract *models.Contract) *ContractResponse {
	if contract == nil {
		return nil
	}
	response := &ContractResponse{
		ID:          contract.ID,
		Amount:      contract.Amount,
		Status:      contract.Status,
		StartedAt:   contract.StartedAt,
		CompletedAt: contract.CompletedAt,
		CreatedAt:   contract.CreatedAt,
		UpdatedAt:   contract.UpdatedAt,
	}

	if contract.Job.ID != uuid.Nil {
		response.Job = ToJobBrief(&contract.Job)
	}

	if contract.Bid.ID != uuid.Nil {
		response.Bid = ToBidBrief(&contract.Bid)
	}

	if contract.Client.ID != uuid.Nil {
		response.Client = ToUserBrief(&contract.Client)
	}

	if contract.Freelancer.ID != uuid.Nil {
		response.Freelancer = ToUserBrief(&contract.Freelancer)
	}

	return response
}

func ToContractResponses(contracts []models.Contract) []*ContractResponse {
	responses := make([]*ContractResponse, len(contracts))
	for i, contract := range contracts {
		responses[i] = ToContractResponse(&contract)
	}
	return responses
}
