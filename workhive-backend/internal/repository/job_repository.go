package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"gorm.io/gorm"
)

type JobRepository interface {
	Create(job *models.Job) error
	List(filter models.JobFilter) ([]models.Job, int64, error)
	GetByID(id string) (*models.Job, error)
	Update(job *models.Job) error
	Delete(id string) error
}

type jobRepository struct {
	db *gorm.DB
}

func NewJobRepository(db *gorm.DB) JobRepository {
	return &jobRepository{db}
}

func (r *jobRepository) Create(job *models.Job) error {
	if err := r.db.Create(job).Error; err != nil {
		return err
	}
	// Preload Client info for the response
	return r.db.Preload("Client").First(job, "id = ?", job.ID).Error
}

func (r *jobRepository) List(filter models.JobFilter) ([]models.Job, int64, error) {
	var jobs []models.Job
	var total int64

	query := r.db.Model(&models.Job{}).Preload("Client")

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}
	if filter.Category != "" {
		query = query.Where("category = ?", filter.Category)
	}
	if filter.MinPrice > 0 {
		query = query.Where("budget_min >= ?", filter.MinPrice)
	}
	if filter.MaxPrice > 0 {
		query = query.Where("budget_max <= ?", filter.MaxPrice)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.ClientID != "" {
		query = query.Where("client_id = ?", filter.ClientID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&jobs).Error

	return jobs, total, err
}

func (r *jobRepository) GetByID(id string) (*models.Job, error) {
	var job models.Job
	err := r.db.Preload("Client").First(&job, "id = ?", id).Error
	return &job, err
}

func (r *jobRepository) Update(job *models.Job) error {
	return r.db.Save(job).Error
}

func (r *jobRepository) Delete(id string) error {
	return r.db.Delete(&models.Job{}, "id = ?", id).Error
}