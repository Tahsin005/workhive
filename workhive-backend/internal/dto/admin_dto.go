package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type AdminUserResponse struct {
	ID        uuid.UUID `json:"id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	AvatarURL *string   `json:"avatar_url"`
	Bio       *string   `json:"bio"`
	IsActive  bool      `json:"is_active"`
	IsDeleted bool      `json:"is_deleted"`
	CreatedAt time.Time `json:"created_at"`
}

type AdminUserStatsResponse struct {
	TotalJobs      int64 `json:"total_jobs"`
	TotalBids      int64 `json:"total_bids"`
	TotalContracts int64 `json:"total_contracts"`
}

type AdminUserDetailResponse struct {
	AdminUserResponse
	Stats AdminUserStatsResponse `json:"stats"`
}

type AdminJobResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	BudgetMin   float64   `json:"budget_min"`
	BudgetMax   float64   `json:"budget_max"`
	Category    string    `json:"category"`
	Status      string    `json:"status"`
	BidCount    int64     `json:"bid_count"` // Since we are not dynamically calculating this per job in the list query right now, we can omit it or calculate it. The prompt asks to "Include bid count per job" in List jobs. Wait, I should add bid_count calculation. Let's see how. For now I'll include the field.
	CreatedAt   time.Time `json:"created_at"`
	Client      UserBrief `json:"client"`
}

func ToAdminUserResponse(u models.User) AdminUserResponse {
	return AdminUserResponse{
		ID:        u.ID,
		FullName:  u.FullName,
		Email:     u.Email,
		Role:      string(u.Role),
		AvatarURL: u.AvatarURL,
		Bio:       u.Bio,
		IsActive:  u.IsActive,
		IsDeleted: u.DeletedAt.Valid,
		CreatedAt: u.CreatedAt,
	}
}

func ToAdminUserDetailResponse(u models.User, totalJobs, totalBids, totalContracts int64) AdminUserDetailResponse {
	return AdminUserDetailResponse{
		AdminUserResponse: ToAdminUserResponse(u),
		Stats: AdminUserStatsResponse{
			TotalJobs:      totalJobs,
			TotalBids:      totalBids,
			TotalContracts: totalContracts,
		},
	}
}

func ToAdminJobResponse(j models.Job, bidCount int64) AdminJobResponse {
	return AdminJobResponse{
		ID:          j.ID,
		Title:       j.Title,
		Description: j.Description,
		BudgetMin:   j.BudgetMin,
		BudgetMax:   j.BudgetMax,
		Category:    j.Category,
		Status:      string(j.Status),
		BidCount:    bidCount,
		CreatedAt:   j.CreatedAt,
		Client:      *ToUserBrief(&j.Client),
	}
}
