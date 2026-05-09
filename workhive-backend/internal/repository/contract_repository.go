package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"gorm.io/gorm"
)

type ContractRepository interface {
	Create(contract *models.Contract) error
	GetByID(id string) (*models.Contract, error)
	List(filter models.ContractFilter) ([]models.Contract, int64, error)
	Update(contract *models.Contract) error
}

type contractRepository struct {
	db *gorm.DB
}

func NewContractRepository(db *gorm.DB) ContractRepository {
	return &contractRepository{db}
}

func (r *contractRepository) Create(contract *models.Contract) error {
	return r.db.Create(contract).Error
}

func (r *contractRepository) GetByID(id string) (*models.Contract, error) {
	var contract models.Contract
	err := r.db.Preload("Job").Preload("Bid").Preload("Client").Preload("Freelancer").First(&contract, "id = ?", id).Error
	return &contract, err
}

func (r *contractRepository) List(filter models.ContractFilter) ([]models.Contract, int64, error) {
	var contracts []models.Contract
	var total int64

	query := r.db.Model(&models.Contract{}).Preload("Job").Preload("Bid").Preload("Client").Preload("Freelancer")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.JobID != "" {
		query = query.Where("job_id = ?", filter.JobID)
	}
	if filter.ClientID != "" {
		query = query.Where("client_id = ?", filter.ClientID)
	}
	if filter.FreelancerID != "" {
		query = query.Where("freelancer_id = ?", filter.FreelancerID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Offset(offset).Limit(filter.Limit).Order("created_at DESC").Find(&contracts).Error

	return contracts, total, err
}

func (r *contractRepository) Update(contract *models.Contract) error {
	return r.db.Save(contract).Error
}
