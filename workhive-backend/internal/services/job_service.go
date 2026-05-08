package services

import (
	"github.com/google/uuid"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
)

type JobService interface {
	CreateJob(input models.CreateJobInput, clientID uuid.UUID) (*models.Job, error)
	ListJobs(filter models.JobFilter) ([]models.Job, int64, error)
	GetJobByID(id string) (*models.Job, error)
}

type jobService struct {
	jobRepo repository.JobRepository
	jwtSecret string
}

func NewJobService(jobRepo repository.JobRepository, jwtSecret string) JobService {
	return &jobService{jobRepo, jwtSecret}
}

func (s *jobService) CreateJob(input models.CreateJobInput, clientID uuid.UUID) (*models.Job, error) {
	job := models.Job{
		ClientID:    clientID,
		Title:       input.Title,
		Description: input.Description,
		BudgetMin:   input.BudgetMin,
		BudgetMax:   input.BudgetMax,
		Category:    input.Category,
		Status:      models.JobStatusOpen,
	}

	if err := s.jobRepo.Create(&job); err != nil {
		return nil, err
	}

	return &job, nil
}

func (s *jobService) ListJobs(filter models.JobFilter) ([]models.Job, int64, error) {
	return s.jobRepo.List(filter)
}

func (s *jobService) GetJobByID(id string) (*models.Job, error) {
	return s.jobRepo.GetByID(id)
}
