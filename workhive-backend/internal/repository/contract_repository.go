package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"gorm.io/gorm"
)

type ContractRepository interface {
	Create(contract *models.Contract) error
	GetByID(id string) (*models.Contract, error)
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
