package services

import (
	"errors"

	"github.com/google/uuid"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
)

type JobService interface {
	CreateJob(input models.CreateJobInput, clientID uuid.UUID) (*models.Job, error)
	ListJobs(filter models.JobFilter) ([]models.Job, int64, error)
	GetJobByID(id string) (*models.Job, error)
	UpdateJob(id string, input models.UpdateJobInput, clientID uuid.UUID) (*models.Job, error)
	DeleteJob(id string, clientID uuid.UUID) error
}

type jobService struct {
	jobRepo   repository.JobRepository
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

func (s *jobService) UpdateJob(id string, input models.UpdateJobInput, clientID uuid.UUID) (*models.Job, error) {
	job, err := s.jobRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if job.ClientID != clientID {
		return nil, errors.New("unauthorized")
	}

	if input.Title != "" {
		job.Title = input.Title
	}
	if input.Description != "" {
		job.Description = input.Description
	}
	if input.BudgetMin > 0 {
		job.BudgetMin = input.BudgetMin
	}
	if input.BudgetMax > 0 {
		job.BudgetMax = input.BudgetMax
	}
	if input.Category != "" {
		job.Category = input.Category
	}
	if input.Status != "" {
		job.Status = models.JobStatus(input.Status)
	}

	if err := s.jobRepo.Update(job); err != nil {
		return nil, err
	}

	return job, nil
}

func (s *jobService) DeleteJob(id string, clientID uuid.UUID) error {
	job, err := s.jobRepo.GetByID(id)
	if err != nil {
		return err
	}

	if job.ClientID != clientID {
		return errors.New("unauthorized")
	}

	return s.jobRepo.Delete(id)
}
