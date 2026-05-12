package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ContractRepository interface {
	Create(contract *models.Contract) error
	GetByID(id string) (*models.Contract, error)
	GetByIDForUpdate(tx *gorm.DB, id string) (*models.Contract, error)
	List(filter models.ContractFilter) ([]models.Contract, int64, error)
	Update(contract *models.Contract) error
	HasActiveContractForJob(jobID string) (bool, error)
	HasPaidPayment(contractID string) (bool, error)
	RestoreBids(jobID string) error
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

func (r *contractRepository) GetByIDForUpdate(tx *gorm.DB, id string) (*models.Contract, error) {
	var contract models.Contract
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Preload("Job").
		Preload("Client").
		Preload("Freelancer").
		First(&contract, "id = ?", id).Error
	return &contract, err
}

func (r *contractRepository) Update(contract *models.Contract) error {
	return r.db.Save(contract).Error
}

// HasActiveContractForJob returns true if the job has an active contract.
func (r *contractRepository) HasActiveContractForJob(jobID string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Contract{}).Where("job_id = ? AND status = ?", jobID, models.ContractStatusActive).Count(&count).Error
	return count > 0, err
}

// HasPaidPayment checks if any paid payment exists for a contract.
func (r *contractRepository) HasPaidPayment(contractID string) (bool, error) {
	var count int64
	err := r.db.Table("payments").Where("contract_id = ? AND status = 'paid' AND deleted_at IS NULL", contractID).Count(&count).Error
	return count > 0, err
}

// RestoreBids sets all rejected and accepted bids for a job back to pending (used when cancelling a contract).
func (r *contractRepository) RestoreBids(jobID string) error {
	return r.db.Model(&models.Bid{}).Where("job_id = ? AND (status = ? OR status = ?)", jobID, models.BidStatusRejected, models.BidStatusAccepted).
		Update("status", models.BidStatusPending).Error
}
