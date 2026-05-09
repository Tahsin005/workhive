package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentRepository interface {
	Create(payment *models.Payment) error
	FindByID(id uuid.UUID) (*models.Payment, error)
	FindByStripePaymentID(stripeID string) (*models.Payment, error)
	FindByContractID(contractID uuid.UUID) ([]models.Payment, error)
	Update(payment *models.Payment) error
	HasActivePayment(contractID uuid.UUID) (bool, error)
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db}
}

func (r *paymentRepository) Create(payment *models.Payment) error {
	return r.db.Create(payment).Error
}

func (r *paymentRepository) FindByID(id uuid.UUID) (*models.Payment, error) {
	var payment models.Payment
	err := r.db.First(&payment, "id = ?", id).Error
	return &payment, err
}

func (r *paymentRepository) FindByStripePaymentID(stripeID string) (*models.Payment, error) {
	var payment models.Payment
	err := r.db.First(&payment, "stripe_payment_id = ?", stripeID).Error
	return &payment, err
}

func (r *paymentRepository) FindByContractID(contractID uuid.UUID) ([]models.Payment, error) {
	var payments []models.Payment
	err := r.db.Preload("Payer").Where("contract_id = ?", contractID).Order("created_at DESC").Find(&payments).Error
	return payments, err
}

func (r *paymentRepository) Update(payment *models.Payment) error {
	return r.db.Save(payment).Error
}

func (r *paymentRepository) HasActivePayment(contractID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Payment{}).
		Where("contract_id = ? AND status IN (?, ?)", contractID, models.PaymentStatusPending, models.PaymentStatusPaid).
		Count(&count).Error
	return count > 0, err
}
