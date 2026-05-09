package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type BidBrief struct {
	ID          uuid.UUID        `json:"id"`
	Amount      float64          `json:"amount"`
	CoverLetter string           `json:"cover_letter"`
	Status      models.BidStatus `json:"status"`
}

type BidResponse struct {
	ID          uuid.UUID        `json:"id"`
	Amount      float64          `json:"amount"`
	CoverLetter string           `json:"cover_letter"`
	Status      models.BidStatus `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Job         *JobBrief        `json:"job,omitempty"`
	Freelancer  *UserBrief       `json:"freelancer,omitempty"`
}

func ToBidBrief(bid *models.Bid) *BidBrief {
	if bid == nil {
		return nil
	}
	return &BidBrief{
		ID:          bid.ID,
		Amount:      bid.Amount,
		CoverLetter: bid.CoverLetter,
		Status:      bid.Status,
	}
}

func ToBidResponse(bid *models.Bid) *BidResponse {
	if bid == nil {
		return nil
	}
	response := &BidResponse{
		ID:          bid.ID,
		Amount:      bid.Amount,
		CoverLetter: bid.CoverLetter,
		Status:      bid.Status,
		CreatedAt:   bid.CreatedAt,
		UpdatedAt:   bid.UpdatedAt,
	}

	if bid.Job.ID != uuid.Nil {
		response.Job = ToJobBrief(&bid.Job)
	}

	if bid.Freelancer.ID != uuid.Nil {
		response.Freelancer = ToUserBrief(&bid.Freelancer)
	}

	return response
}

func ToBidResponses(bids []models.Bid) []*BidResponse {
	responses := make([]*BidResponse, len(bids))
	for i, bid := range bids {
		responses[i] = ToBidResponse(&bid)
	}
	return responses
}
