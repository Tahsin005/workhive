package dto

import (
	"github.com/google/uuid"
)

type ClientDashboardResponse struct {
	Stats struct {
		TotalJobs       int64   `json:"total_jobs"`
		ActiveContracts int64   `json:"active_contracts"`
		TotalSpent      float64 `json:"total_spent"`
	} `json:"stats"`
	RecentJobs      []*JobResponse      `json:"recent_jobs"`
	RecentContracts []*ContractResponse `json:"recent_contracts"`
}

type FreelancerDashboardResponse struct {
	Stats struct {
		TotalBids       int64   `json:"total_bids"`
		ActiveContracts int64   `json:"active_contracts"`
		TotalEarnings   float64 `json:"total_earnings"`
	} `json:"stats"`
	RecentBids      []*BidResponse      `json:"recent_bids"`
	RecentContracts []*ContractResponse `json:"recent_contracts"`
}

type DashboardProjectBrief struct {
	ID     uuid.UUID `json:"id"`
	Title  string    `json:"title"`
	Status string    `json:"status"`
	Amount float64   `json:"amount"`
}
