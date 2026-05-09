package dto

import (
	"time"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
)

type JobBrief struct {
	ID       uuid.UUID        `json:"id"`
	Title    string           `json:"title"`
	Category string           `json:"category"`
	Status   models.JobStatus `json:"status"`
}

type JobResponse struct {
	ID          uuid.UUID        `json:"id"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	BudgetMin   float64          `json:"budget_min"`
	BudgetMax   float64          `json:"budget_max"`
	Category    string           `json:"category"`
	Status      models.JobStatus `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Client      *UserBrief       `json:"client,omitempty"`
}

func ToJobBrief(job *models.Job) *JobBrief {
	if job == nil {
		return nil
	}
	return &JobBrief{
		ID:       job.ID,
		Title:    job.Title,
		Category: job.Category,
		Status:   job.Status,
	}
}

func ToJobResponse(job *models.Job) *JobResponse {
	if job == nil {
		return nil
	}
	response := &JobResponse{
		ID:          job.ID,
		Title:       job.Title,
		Description: job.Description,
		BudgetMin:   job.BudgetMin,
		BudgetMax:   job.BudgetMax,
		Category:    job.Category,
		Status:      job.Status,
		CreatedAt:   job.CreatedAt,
		UpdatedAt:   job.UpdatedAt,
	}

	if job.Client.ID != uuid.Nil {
		response.Client = ToUserBrief(&job.Client)
	}

	return response
}

func ToJobResponses(jobs []models.Job) []*JobResponse {
	responses := make([]*JobResponse, len(jobs))
	for i, job := range jobs {
		responses[i] = ToJobResponse(&job)
	}
	return responses
}
